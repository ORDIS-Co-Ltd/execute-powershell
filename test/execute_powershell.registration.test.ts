import { describe, it, expect } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index";
import type { ToolDefinition } from "@opencode-ai/plugin";

describe("tool registration", () => {
  it("plugin registers execute_powershell tool", async () => {
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.execute_powershell).toBeDefined();
  });

  it("execute_powershell is a ToolDefinition", async () => {
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;
    expect(toolDef.description).toBeDefined();
    expect(toolDef.args).toBeDefined();
    expect(typeof toolDef.execute).toBe("function");
  });

  it("execute_powershell execute handler returns string", async () => {
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;
    const result = await toolDef.execute(
      { command: "echo test", description: "test", timeout_ms: 5000 },
      { sessionID: "test", messageID: "test", agent: "test", directory: "", worktree: "", abort: new AbortController().signal, metadata: () => {}, ask: async () => {} }
    );

    expect(result).toBe("placeholder_output");
  });
});
