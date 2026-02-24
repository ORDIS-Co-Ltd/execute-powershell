import type { Plugin } from "@opencode-ai/plugin";
import { execute_powershell } from "./tools/execute_powershell.js";

export const ExecutePowerShellPlugin: Plugin = async () => {
  return {
    tool: {
      execute_powershell,
    },
  };
};
