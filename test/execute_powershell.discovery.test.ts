import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index";
import type { Hooks, PluginInput } from "@opencode-ai/plugin";
import type { ToolContext, ToolDefinition } from "@opencode-ai/plugin/tool";

function createStreamFromString(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function setupSpawnMock(expectedOutput: string, exitCode = 0) {
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

class ToolRegistry {
  private constructor(private readonly tools: Map<string, ToolDefinition>) {}

  static fromPlugin(hooks: Hooks): ToolRegistry {
    const tools = new Map<string, ToolDefinition>();
    for (const [name, definition] of Object.entries(hooks.tool ?? {})) {
      tools.set(name, definition);
    }
    return new ToolRegistry(tools);
  }

  list() {
    return [...this.tools.entries()];
  }

  get(toolName: string) {
    return this.tools.get(toolName);
  }

  async execute(toolName: string, args: unknown, context: ToolContext) {
    const tool = this.tools.get(toolName);
    if (!tool) throw new Error(`Tool not found: ${toolName}`);
    return tool.execute(args as any, context);
  }
}

describe("Tool discovery and session invokability", () => {
  let originalBunSpawn: typeof Bun.spawn;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

  async function createPluginHooks() {
    const input: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    };
    return ExecutePowerShellPlugin(input);
  }

  it("discovers execute_powershell through registry construction", async () => {
    const hooks = await createPluginHooks();
    const registry = ToolRegistry.fromPlugin(hooks);

    const names = registry.list().map(([name]) => name);
    expect(names).toContain("execute_powershell");

    const tool = registry.get("execute_powershell");
    expect(tool).toBeDefined();
    expect(tool?.description).toBe("Execute PowerShell commands on Windows");
    expect(tool?.args.command).toBeDefined();
    expect(tool?.args.description).toBeDefined();
    expect(tool?.args.timeout_ms).toBeDefined();
    expect(tool?.args.workdir).toBeDefined();
  });

  it("invokes execute_powershell via registry execute path", async () => {
    const expectedOutput = "PowerShell output test";
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn =
      setupSpawnMock(expectedOutput, 0);

    const hooks = await createPluginHooks();
    const registry = ToolRegistry.fromPlugin(hooks);

    const result = await registry.execute(
      "execute_powershell",
      { command: "Write-Host test", description: "test", timeout_ms: 5000 },
      {
        sessionID: "test-session",
        messageID: "test-msg",
        agent: "test",
        directory: "/test/dir",
        worktree: "",
        abort: new AbortController().signal,
        metadata: () => {},
        ask: async () => {},
      }
    );

    expect(typeof result).toBe("string");
    expect(result).toContain(expectedOutput);
  });
});
