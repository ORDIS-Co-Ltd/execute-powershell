import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { argsSchema, execute_powershell } from "../src/tools/execute_powershell";

const schema = z.object(argsSchema);

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
  it("defaults workdir to context.directory when omitted", async () => {
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

    expect(result).toBe("Executed in: /project/root");
  });

  it("preserves explicit workdir argument value", async () => {
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

    expect(result).toBe("Executed in: /explicit/path");
  });
});