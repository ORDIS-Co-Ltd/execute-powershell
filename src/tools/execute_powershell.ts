import { tool, type ToolContext, type ToolDefinition } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import { askExecutePowerShellPermission } from "./permissions.js";
import { askExternalDirectoryIfRequired, resolveWorkdir } from "./workdir.js";
import { formatMetadataFooter, type PowerShellMetadata } from "./metadata.js";
import { resolvePowerShellExecutable } from "./powershell_exe.js";
import { spawnPowerShell, createTerminationSignal, terminateProcessTree } from "./process.js";
import { collectCombinedOutput } from "./output.js";

const argsSchema = {
  command: z.string(),
  description: z.string(),
  timeout_ms: z.number().int().min(0).default(120000),
  workdir: z.string().optional(),
} as const;

type ArgsType = {
  command: string;
  description: string;
  timeout_ms?: number;
  workdir?: string;
};

export const execute_powershell: ToolDefinition = tool({
  description: "Execute PowerShell commands on Windows",
  args: argsSchema as any,
  async execute(args: ArgsType, context: ToolContext) {
    await askExecutePowerShellPermission(context, args.command);
    const resolvedWorkdir = resolveWorkdir(context.directory, args.workdir);
    await askExternalDirectoryIfRequired(context, resolvedWorkdir);
    const timeoutMs = args.timeout_ms ?? 120000;
    const { signal, getEndedBy } = createTerminationSignal(
      context.abort,
      timeoutMs
    );
    const startTime = Date.now();
    let exitCode = 0;
    let shell = "unknown";
    let proc: ReturnType<typeof spawnPowerShell> | undefined;

    try {
      const exe = resolvePowerShellExecutable();
      shell = exe.kind;

      proc = spawnPowerShell({
        exePath: exe.path,
        command: args.command,
        cwd: resolvedWorkdir,
        signal,
      });
      const output = await collectCombinedOutput(proc);
      exitCode = await proc.exited;
      const durationMs = Date.now() - startTime;
      const endedBy = getEndedBy();

      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell,
        resolvedWorkdir,
        timeoutMs,
        durationMs,
      };

      return output + formatMetadataFooter(metadata);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const endedBy = getEndedBy();
      exitCode = endedBy === "timeout" ? 1 : -1;

      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell,
        resolvedWorkdir,
        timeoutMs,
        durationMs,
      };

      const errorOutput = error instanceof Error ? error.message : String(error);
      return errorOutput + formatMetadataFooter(metadata);
    } finally {
      const endedBy = getEndedBy();
      if ((endedBy === "timeout" || endedBy === "abort") && proc?.pid) {
        await terminateProcessTree(proc.pid);
      }
    }
  },
});

export { argsSchema };
