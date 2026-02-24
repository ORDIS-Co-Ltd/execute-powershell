import { tool, type ToolContext } from "@opencode-ai/plugin/tool";
import { z } from "zod";
import { askExecutePowerShellPermission } from "./permissions.js";
import { askExternalDirectoryIfRequired, resolveWorkdir } from "./workdir.js";

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

    return `Executed in: ${resolvedWorkdir}`;
  },
});

export { argsSchema };
