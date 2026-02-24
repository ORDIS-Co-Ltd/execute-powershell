import { describe, it, expect, spyOn, mock, beforeEach, afterEach } from "bun:test";
import { execute_powershell } from "../src/tools/execute_powershell.js";
import { askExecutePowerShellPermission } from "../src/tools/permissions.js";
import { parseMetadataFooter } from "../src/tools/metadata.js";

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

// Helper function to create a mock context
function createMockContext() {
  const abortController = new AbortController();
  const askFn = mock(async () => {});

  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "test-agent",
    directory: "/project/root",
    worktree: "/project",
    abort: abortController.signal,
    metadata: () => {},
    ask: askFn,
  };
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

describe("execute_powershell permission ask", () => {
  let originalBunSpawn: typeof Bun.spawn;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

  describe("askExecutePowerShellPermission function", () => {
    it("calls context.ask() with correct permission field", async () => {
      const context = createMockContext();
      const command = "Get-Process";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.permission).toBe("execute_powershell");
    });

    it("calls context.ask() with command in patterns array", async () => {
      const context = createMockContext();
      const command = "Get-Process -Name chrome";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.patterns).toEqual([command]);
    });

    it("calls context.ask() with always pattern wrapped in array", async () => {
      const context = createMockContext();
      const command = "Get-Process -Name chrome";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.always).toEqual(["Get-Process *"]);
    });

    it("calls context.ask() with empty metadata object", async () => {
      const context = createMockContext();
      const command = "Get-Process";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.metadata).toEqual({});
    });

    it("handles simple command correctly", async () => {
      const context = createMockContext();
      const command = "Write-Host 'Hello'";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.permission).toBe("execute_powershell");
      expect(callArgs.patterns).toEqual([command]);
      expect(callArgs.always).toEqual(["Write-Host *"]);
    });

    it("handles command with ampersand prefix correctly", async () => {
      const context = createMockContext();
      const command = "& script.ps1 -Verbose";

      await askExecutePowerShellPermission(context as any, command);

      expect(context.ask).toHaveBeenCalledTimes(1);
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs.permission).toBe("execute_powershell");
      expect(callArgs.patterns).toEqual([command]);
      expect(callArgs.always).toEqual(["script.ps1 *"]);
    });
  });

  describe("execute_powershell tool permission integration", () => {
    it("calls context.ask() before returning execution result", async () => {
      const context = createMockContext();
      const callOrder: string[] = [];

      // Mock Bun.spawn to return expected output
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Executed in: /project/root");

      // Wrap the mock to track call order
      const originalAsk = context.ask;
      context.ask = mock(async (...args: any[]) => {
        callOrder.push("ask");
        return (originalAsk as any)(...args);
      });

      const result = await execute_powershell.execute(
        {
          command: "Get-Process",
          description: "List processes",
        },
        context as any
      );

      // Verify ask was called first
      expect(callOrder).toEqual(["ask"]);
      expect(context.ask).toHaveBeenCalledTimes(1);

      // Verify the payload structure
      const callArgs = (context.ask as any).mock.calls[0][0];
      expect(callArgs).toMatchObject({
        permission: "execute_powershell",
        patterns: ["Get-Process"],
        always: expect.any(Array),
        metadata: expect.any(Object),
      });

      // Verify execution completed after permission ask - check result contains expected output
      expect(result).toContain("Executed in: /project/root");
      
      // Verify metadata footer is present and valid
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(0);
      expect(metadata?.resolvedWorkdir).toBe("/project/root");
    });

    it("permission ask contains all required payload fields", async () => {
      const context = createMockContext();
      const command = "Start-Process notepad";

      // Mock Bun.spawn
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Process started");

      await execute_powershell.execute(
        {
          command,
          description: "Open notepad",
        },
        context as any
      );

      expect(context.ask).toHaveBeenCalledTimes(1);

      const callArgs = (context.ask as any).mock.calls[0][0];

      // Verify all required fields are present and correct
      expect(callArgs).toHaveProperty("permission");
      expect(callArgs).toHaveProperty("patterns");
      expect(callArgs).toHaveProperty("always");
      expect(callArgs).toHaveProperty("metadata");

      expect(callArgs.permission).toBe("execute_powershell");
      expect(Array.isArray(callArgs.patterns)).toBe(true);
      expect(callArgs.patterns).toContain(command);
      expect(Array.isArray(callArgs.always)).toBe(true);
      expect(callArgs.always.length).toBeGreaterThan(0);
      expect(typeof callArgs.metadata).toBe("object");
    });

    it("permission is checked before any workdir logic is applied", async () => {
      const callOrder: string[] = [];
      const abortController = new AbortController();

      const context = {
        sessionID: "test-session",
        messageID: "test-message",
        agent: "test-agent",
        directory: "/custom/dir",
        worktree: "/project",
        abort: abortController.signal,
        metadata: () => {},
        ask: mock(async () => {
          callOrder.push("ask");
        }),
      };

      // Mock Bun.spawn
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("Executed in: /custom/dir");

      const result = await execute_powershell.execute(
        {
          command: "Get-Process",
          description: "List processes",
        },
        context as any
      );

      // Permission ask should be first
      expect(callOrder).toEqual(["ask"]);
      expect(result).toContain("Executed in: /custom/dir");
      
      // Verify metadata footer contains correct workdir
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.resolvedWorkdir).toBe("/custom/dir");
    });

    it("passes the exact command to permission ask", async () => {
      const commands = [
        "Get-Process",
        "Get-ChildItem -Recurse",
        "Invoke-Expression 'Write-Host test'",
        "& 'C:\\Program Files\\script.ps1'",
      ];

      for (const command of commands) {
        const context = createMockContext();

        // Mock Bun.spawn
        (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("output");

        await execute_powershell.execute(
          {
            command,
            description: "Test command",
          },
          context as any
        );

        expect(context.ask).toHaveBeenCalledTimes(1);
        const callArgs = (context.ask as any).mock.calls[0][0];
        expect(callArgs.patterns).toEqual([command]);
        expect(callArgs.permission).toBe("execute_powershell");
      }
    });

    it("correctly derives always pattern for various command formats", async () => {
      const testCases = [
        { command: "Get-Process", expected: "Get-Process *" },
        { command: "  Get-Process  ", expected: "Get-Process *" },
        { command: "Get-ChildItem -Path C:\\", expected: "Get-ChildItem *" },
        { command: "& script.ps1", expected: "script.ps1 *" },
        { command: ". script.ps1 -Param value", expected: "script.ps1 *" },
      ];

      for (const { command, expected } of testCases) {
        const context = createMockContext();

        // Mock Bun.spawn
        (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMock("output");

        await execute_powershell.execute(
          {
            command,
            description: "Test command",
          },
          context as any
        );

        expect(context.ask).toHaveBeenCalledTimes(1);
        const callArgs = (context.ask as any).mock.calls[0][0];
        expect(callArgs.always).toEqual([expected]);
      }
    });
  });
});
