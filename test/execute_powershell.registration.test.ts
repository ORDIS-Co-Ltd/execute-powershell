import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index";
import type { ToolDefinition } from "@opencode-ai/plugin";
import { parseMetadataFooter } from "../src/tools/metadata.js";
import * as powershellExe from "../src/tools/powershell_exe.js";

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

describe("tool registration", () => {
  let originalBunSpawn: typeof Bun.spawn;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

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

  it("execute_powershell execute handler returns string with metadata footer", async () => {
    // Mock Bun.spawn to return expected output
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Executed in: /test/dir");

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
      { sessionID: "test", messageID: "test", agent: "test", directory: "/test/dir", worktree: "", abort: new AbortController().signal, metadata: () => {}, ask: async () => {} }
    );

    // Verify result contains expected output
    expect(result).toContain("Executed in: /test/dir");
    
    // Verify metadata footer is present and valid
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.exitCode).toBe(0);
    expect(metadata?.resolvedWorkdir).toBe("/test/dir");
    expect(metadata?.shell).toBeDefined();
    expect(metadata?.endedBy).toBe("exit");
  });

  it("returns error output with metadata when executable resolution fails", async () => {
    const resolverSpy = spyOn(powershellExe, "resolvePowerShellExecutable").mockImplementation(() => {
      throw new Error("PowerShell not found");
    });

    try {
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
        {
          sessionID: "test",
          messageID: "test",
          agent: "test",
          directory: "/test/dir",
          worktree: "",
          abort: new AbortController().signal,
          metadata: () => {},
          ask: async () => {},
        }
      );

      expect(result).toContain("PowerShell not found");
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(-1);
      expect(metadata?.shell).toBe("unknown");
    } finally {
      resolverSpy.mockRestore();
    }
  });
});
