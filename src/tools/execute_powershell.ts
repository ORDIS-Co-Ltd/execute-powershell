import { tool, type ToolContext } from "@opencode-ai/plugin/tool";
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

type ArgsType = z.infer<z.ZodObject<typeof argsSchema>>;

export const execute_powershell = tool({
  description: "Execute PowerShell commands on Windows",
  args: argsSchema as z.ZodRawShape,
  async execute(args: ArgsType, context: ToolContext) {
    // Permission check MUST happen before any spawn logic
    await askExecutePowerShellPermission(context, args.command);

    // Resolve workdir and check external_directory permission if needed
    const resolvedWorkdir = resolveWorkdir(context.directory, args.workdir);
    await askExternalDirectoryIfRequired(context, resolvedWorkdir);

    // Resolve PowerShell executable
    const exe = resolvePowerShellExecutable();

    // Apply default timeout if not provided
    const timeoutMs = args.timeout_ms ?? 120000;

    // Create termination signal coordinator with context abort and timeout
    const { signal: abortSignal, getEndedBy } = createTerminationSignal(
      context.abort,
      timeoutMs
    );

    // Track execution start time
    const startTime = Date.now();
    let exitCode = 0;
    let proc: ReturnType<typeof spawnPowerShell> | undefined;

    try {
      // Spawn PowerShell process
      proc = spawnPowerShell({
        exePath: exe.path,
        command: args.command,
        cwd: resolvedWorkdir,
        signal: abortSignal,
      });

      // Collect combined output
      const output = await collectCombinedOutput(proc);

      // Get exit code
      exitCode = await proc.exited;

      // Calculate duration
      const durationMs = Date.now() - startTime;

      // Get endedBy from the coordinator
      const endedBy = getEndedBy();

      // Terminate process tree if ended by timeout or abort
      if (endedBy === "timeout" || endedBy === "abort") {
        if (proc.pid) {
          await terminateProcessTree(proc.pid);
        }
      }

      // Build metadata
      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell: exe.kind,
        resolvedWorkdir,
        timeoutMs,
        durationMs,
      };

      // Return output with metadata footer
      return output + formatMetadataFooter(metadata);
    } catch (error) {
      // Calculate duration for error case
      const durationMs = Date.now() - startTime;

      // Get endedBy from the coordinator (reports timeout/abort/exit)
      const endedBy = getEndedBy();

      // Determine exit code based on how execution ended
      if (endedBy === "timeout") {
        exitCode = 1;
      } else if (endedBy === "abort" || proc?.killed) {
        exitCode = -1;
      } else {
        exitCode = -1;
      }

      // Build metadata for error case
      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell: exe.kind,
        resolvedWorkdir,
        timeoutMs,
        durationMs,
      };

      // Return error message with metadata footer
      const errorOutput = error instanceof Error ? error.message : String(error);
      return errorOutput + formatMetadataFooter(metadata);
    }
  },
});

export { argsSchema };
