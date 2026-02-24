import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { z } from "zod";
import { argsSchema, execute_powershell } from "../src/tools/execute_powershell";
import { parseMetadataFooter } from "../src/tools/metadata.js";

const schema = z.object(argsSchema);

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

describe("workdir argument schema", () => {
  it("accepts workdir when provided", () => {
    const result = schema.parse({
      command: "echo test",
      description: "test command",
      workdir: "/custom/path",
    });
    expect(result.workdir).toBe("/custom/path");
  });

  it("accepts omitted workdir", () => {
    const result = schema.parse({
      command: "echo test",
      description: "test command",
    });
    expect(result.workdir).toBeUndefined();
  });
});

describe("workdir runtime default behavior", () => {
  let originalBunSpawn: typeof Bun.spawn;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

  it("defaults workdir to context.directory when omitted", async () => {
    // Mock Bun.spawn
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Executed in: /project/root");

    const abortController = new AbortController();
    const mockContext = {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      directory: "/project/root",
      worktree: "/project",
      abort: abortController.signal,
      metadata: () => {},
      ask: async () => {},
    };

    const result = await execute_powershell.execute(
      {
        command: "echo test",
        description: "test command",
      },
      mockContext as any
    );

    // Verify result contains expected output
    expect(result).toContain("Executed in: /project/root");
    
    // Verify metadata footer contains correct workdir
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.resolvedWorkdir).toBe("/project/root");
  });

  it("preserves explicit workdir argument value", async () => {
    // Mock Bun.spawn
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Executed in: /explicit/path");

    const abortController = new AbortController();
    const mockContext = {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      directory: "/project/root",
      worktree: "/project",
      abort: abortController.signal,
      metadata: () => {},
      ask: async () => {},
    };

    const result = await execute_powershell.execute(
      {
        command: "echo test",
        description: "test command",
        workdir: "/explicit/path",
      },
      mockContext as any
    );

    // Verify result contains expected output
    expect(result).toContain("Executed in: /explicit/path");
    
    // Verify metadata footer contains correct workdir
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.resolvedWorkdir).toBe("/explicit/path");
  });
});
