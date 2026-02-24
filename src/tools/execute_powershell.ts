import { tool, type ToolContext } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import { askExecutePowerShellPermission } from "./permissions.js";
import { askExternalDirectoryIfRequired, resolveWorkdir } from "./workdir.js";
import { formatMetadataFooter, type PowerShellMetadata } from "./metadata.js";
import { resolvePowerShellExecutable } from "./powershell_exe.js";
import { spawnPowerShell } from "./process.js";
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

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = args.timeout_ms > 0
      ? setTimeout(() => controller.abort(), args.timeout_ms)
      : null;

    // Track execution start time
    const startTime = Date.now();
    let endedBy: PowerShellMetadata["endedBy"] = "exit";
    let exitCode = 0;

    try {
      // Spawn PowerShell process
      const proc = spawnPowerShell({
        exePath: exe.path,
        command: args.command,
        cwd: resolvedWorkdir,
        signal: controller.signal,
      });

      // Collect combined output
      const output = await collectCombinedOutput(proc);

      // Get exit code
      exitCode = await proc.exited;

      // Calculate duration
      const durationMs = Date.now() - startTime;

      // Clear timeout if process finished normally
      if (timeoutId) clearTimeout(timeoutId);

      // Build metadata
      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell: exe.kind,
        resolvedWorkdir,
        timeoutMs: args.timeout_ms,
        durationMs,
      };

      // Return output with metadata footer
      return output + formatMetadataFooter(metadata);
    } catch (error) {
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);

      // Determine how execution ended
      if (controller.signal.aborted) {
        endedBy = "timeout";
        exitCode = 1;
      } else {
        endedBy = "abort";
        exitCode = -1;
      }

      const durationMs = Date.now() - startTime;

      // Build metadata for error case
      const metadata: PowerShellMetadata = {
        exitCode,
        endedBy,
        shell: exe.kind,
        resolvedWorkdir,
        timeoutMs: args.timeout_ms,
        durationMs,
      };

      // Return error message with metadata footer
      const errorOutput = error instanceof Error ? error.message : String(error);
      return errorOutput + formatMetadataFooter(metadata);
    }
  },
});

export { argsSchema };
