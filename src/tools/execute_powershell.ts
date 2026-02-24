import { tool, type ToolContext } from "@opencode-ai/plugin/tool";
import { z } from "zod";

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
    const effectiveWorkdir = args.workdir ?? context.directory;
    return "placeholder_output";
  },
});

export { argsSchema };
