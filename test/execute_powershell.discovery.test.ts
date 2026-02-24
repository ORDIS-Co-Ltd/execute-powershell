import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index";
import type { ToolDefinition } from "@opencode-ai/plugin";

// Helper function to create a readable stream from string
function createStreamFromString(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

// Helper function to setup Bun.spawn mock
function setupSpawnMock(expectedOutput: string, exitCode: number = 0) {
  return mock(() => {
    return {
      stdout: createStreamFromString(expectedOutput),
      stderr: createStreamFromString(""),
      stdin: { write: () => {} },
      exited: Promise.resolve(exitCode),
      pid: 12345,
    } as unknown as ReturnType<typeof Bun.spawn>;
  });
}

describe("Tool Discovery and Invokability", () => {
  let originalBunSpawn: typeof Bun.spawn;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

  it("discovers execute_powershell in tool inventory", async () => {
    // Register plugin and construct runtime tool inventory
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    // Verify tool registry entries exist
    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.execute_powershell).toBeDefined();

    // Get the tool definition
    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;

    // Verify expected description
    expect(toolDef.description).toBe("Execute PowerShell commands on Windows");

    // Verify argument schema keys
    expect(toolDef.args).toBeDefined();
    expect(toolDef.args).toHaveProperty("command");
    expect(toolDef.args).toHaveProperty("description");
    expect(toolDef.args).toHaveProperty("timeout_ms");
    expect(toolDef.args).toHaveProperty("workdir");
  });

  it("invokes tool through registry and returns string", async () => {
    // Mock Bun.spawn to return expected output
    const expectedOutput = "PowerShell output test";
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock(expectedOutput, 0);

    // Register plugin and construct runtime tool inventory
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    // Get the tool from inventory
    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;

    // Invoke tool through registry execution path
    const result = await toolDef.execute(
      { command: "Write-Output 'test'", description: "test", timeout_ms: 5000 },
      { 
        sessionID: "test-session", 
        messageID: "test-msg", 
        agent: "test", 
        directory: "/test/dir", 
        worktree: "", 
        abort: new AbortController().signal, 
        metadata: () => {}, 
        ask: async () => {} 
      }
    );

    // Assert string output contract
    expect(typeof result).toBe("string");
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain(expectedOutput);
  });
});
