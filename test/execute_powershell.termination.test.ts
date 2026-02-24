import { describe, it, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
import { terminateProcessTree } from "../src/tools/process.js";
import { execute_powershell } from "../src/tools/execute_powershell.js";

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
function createMockContext(abortSignal?: AbortSignal) {
  const abortController = abortSignal ? undefined : new AbortController();
  const askFn = mock(async () => {});

  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "test-agent",
    directory: "/project/root",
    worktree: "/project",
    abort: abortSignal ?? abortController!.signal,
    metadata: () => {},
    ask: askFn,
  };
}

// Helper function to setup Bun.spawn mock with delayed output (for timeout testing)
function setupDelayedSpawnMock(expectedOutput: string, delayMs: number, exitCode: number = 0, pid: number = 12345) {
  return mock(() => {
    return {
      stdout: new ReadableStream<Uint8Array>({
        start(controller) {
          setTimeout(() => {
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(expectedOutput));
            controller.close();
          }, delayMs);
        },
      }),
      stderr: createStreamFromString(""),
      stdin: { write: () => {} },
      exited: new Promise((resolve) => setTimeout(() => resolve(exitCode), delayMs)),
      pid: pid,
    } as unknown as ReturnType<typeof Bun.spawn>;
  });
}

// Helper function to setup Bun.spawn mock with abort signal
function setupSpawnMockWithAbort(expectedOutput: string, exitCode: number = 0, pid: number = 12345) {
  return mock(() => {
    return {
      stdout: createStreamFromString(expectedOutput),
      stderr: createStreamFromString(""),
      stdin: { write: () => {} },
      exited: Promise.resolve(exitCode),
      pid: pid,
    } as unknown as ReturnType<typeof Bun.spawn>;
  });
}

describe("terminateProcessTree", () => {
  let originalBunSpawn: typeof Bun.spawn;
  let originalPlatform: PropertyDescriptor | undefined;
  let originalKill: typeof process.kill;
  let spawnMock: ReturnType<typeof mock>;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
    originalPlatform = Object.getOwnPropertyDescriptor(process, "platform");
    originalKill = process.kill;

    // Mock Bun.spawn
    spawnMock = mock(() => {
      return {
        exited: Promise.resolve(0),
      } as unknown as ReturnType<typeof Bun.spawn>;
    });
    (Bun as unknown as { spawn: typeof spawnMock }).spawn = spawnMock;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
    process.kill = originalKill;

    // Restore original platform
    if (originalPlatform) {
      Object.defineProperty(process, "platform", originalPlatform);
    }
  });

  describe("Windows platform", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });
    });

    it("calls taskkill with correct arguments", async () => {
      await terminateProcessTree(12345);

      expect(spawnMock).toHaveBeenCalledTimes(1);
      const callArg = spawnMock.mock.calls[0][0] as string[];
      expect(callArg).toEqual([
        "taskkill",
        "/PID",
        "12345",
        "/T",
        "/F",
      ]);
    });

    it("waits for taskkill to complete", async () => {
      let resolved = false;

      spawnMock.mockImplementation(() => {
        return {
          exited: new Promise((resolve) => {
            setTimeout(() => {
              resolved = true;
              resolve(0);
            }, 50);
          }),
        } as unknown as ReturnType<typeof Bun.spawn>;
      });

      await terminateProcessTree(12345);

      expect(resolved).toBe(true);
    });

    it("handles different PIDs", async () => {
      await terminateProcessTree(99999);

      const callArg = spawnMock.mock.calls[0][0] as string[];
      expect(callArg[2]).toBe("99999");
    });
  });

  describe("Unix platform", () => {
    beforeEach(() => {
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });
    });

    it("calls process.kill with negative PID and SIGKILL", async () => {
      const killCalls: Array<{ pid: number; signal: string }> = [];
      const killMock = mock((pid: number, signal: string) => {
        killCalls.push({ pid, signal });
      });
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(12345);

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(killCalls[0].pid).toBe(-12345);
      expect(killCalls[0].signal).toBe("SIGKILL");
    });

    it("handles different PIDs on Unix", async () => {
      const killCalls: Array<{ pid: number; signal: string }> = [];
      const killMock = mock((pid: number, signal: string) => {
        killCalls.push({ pid, signal });
      });
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(99999);

      expect(killCalls[0].pid).toBe(-99999);
    });

    it("ignores errors when process is already dead", async () => {
      const killMock = mock(() => {
        throw new Error("ESRCH");
      });
      process.kill = killMock as unknown as typeof process.kill;

      // Should not throw
      await expect(terminateProcessTree(12345)).resolves.toBeUndefined();
    });

    it("works on darwin platform", async () => {
      Object.defineProperty(process, "platform", {
        value: "darwin",
        configurable: true,
      });

      const killCalls: Array<{ pid: number; signal: string }> = [];
      const killMock = mock((pid: number, signal: string) => {
        killCalls.push({ pid, signal });
      });
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(12345);

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(killCalls[0].pid).toBe(-12345);
    });
  });

  describe("platform detection", () => {
    it("uses Windows path when platform is win32", async () => {
      Object.defineProperty(process, "platform", {
        value: "win32",
        configurable: true,
      });

      await terminateProcessTree(12345);

      expect(spawnMock).toHaveBeenCalledTimes(1);
      const callArg = spawnMock.mock.calls[0][0] as string[];
      expect(callArg[0]).toBe("taskkill");
    });

    it("uses Unix path when platform is linux", async () => {
      Object.defineProperty(process, "platform", {
        value: "linux",
        configurable: true,
      });

      const killMock = mock(() => {});
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(12345);

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(spawnMock).toHaveBeenCalledTimes(0);
    });

    it("uses Unix path when platform is darwin", async () => {
      Object.defineProperty(process, "platform", {
        value: "darwin",
        configurable: true,
      });

      const killMock = mock(() => {});
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(12345);

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(spawnMock).toHaveBeenCalledTimes(0);
    });

    it("uses Unix path for other platforms", async () => {
      Object.defineProperty(process, "platform", {
        value: "freebsd",
        configurable: true,
      });

      const killMock = mock(() => {});
      process.kill = killMock as unknown as typeof process.kill;

      await terminateProcessTree(12345);

      expect(killMock).toHaveBeenCalledTimes(1);
      expect(spawnMock).toHaveBeenCalledTimes(0);
    });
  });

  describe("execute_powershell integration", () => {
    let originalBunSpawn: typeof Bun.spawn;
    let terminateSpy: ReturnType<typeof spyOn>;

    beforeEach(async () => {
      originalBunSpawn = Bun.spawn;
      terminateSpy = spyOn(await import("../src/tools/process.js"), "terminateProcessTree");
    });

    afterEach(() => {
      (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
      terminateSpy.mockRestore();
    });

    it("calls terminateProcessTree on timeout", async () => {
      // Use a very short timeout so the process doesn't complete in time
      const timeoutMs = 50;

      // Mock spawn to return a process that takes longer than the timeout
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupDelayedSpawnMock(
        "This will timeout",
        500, // delay longer than timeout
        0,
        12345
      );

      const context = createMockContext();

      await execute_powershell.execute(
        {
          command: "Start-Sleep -Seconds 10",
          description: "Long running command",
          timeout_ms: timeoutMs,
        },
        context as any
      );

      // Wait a bit for the finally block to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify terminateProcessTree was called with the PID
      expect(terminateSpy).toHaveBeenCalledTimes(1);
      expect(terminateSpy.mock.calls[0][0]).toBe(12345);
    });

    it("calls terminateProcessTree on abort", async () => {
      // Create an already-aborted signal
      const abortController = new AbortController();
      abortController.abort();

      // Mock spawn to return a process
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMockWithAbort(
        "output",
        0,
        99999
      );

      const context = createMockContext(abortController.signal);

      await execute_powershell.execute(
        {
          command: "Write-Host 'test'",
          description: "Test command",
        },
        context as any
      );

      // Wait a bit for the finally block to execute
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify terminateProcessTree was called with the PID
      expect(terminateSpy).toHaveBeenCalledTimes(1);
      expect(terminateSpy.mock.calls[0][0]).toBe(99999);
    });

    it("does not call terminateProcessTree on normal exit", async () => {
      // Mock spawn to return a process that completes immediately
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupSpawnMockWithAbort(
        "Normal output",
        0,
        55555
      );

      const context = createMockContext();

      await execute_powershell.execute(
        {
          command: "Write-Host 'Hello'",
          description: "Simple command",
        },
        context as any
      );

      // Verify terminateProcessTree was NOT called for normal exit
      expect(terminateSpy).toHaveBeenCalledTimes(0);
    });

    it("calls terminateProcessTree with correct PID on timeout", async () => {
      // Use a very short timeout
      const timeoutMs = 50;
      const testPid = 77777;

      // Mock spawn to return a process that times out
      (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = setupDelayedSpawnMock(
        "partial output",
        500, // delay longer than timeout
        0,
        testPid
      );

      const context = createMockContext();

      await execute_powershell.execute(
        {
          command: "Start-Sleep -Seconds 10",
          description: "Long running command",
          timeout_ms: timeoutMs,
        },
        context as any
      );

      // Wait for timeout to trigger and finally block to execute
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify terminateProcessTree was called with the correct PID
      expect(terminateSpy).toHaveBeenCalledTimes(1);
      expect(terminateSpy.mock.calls[0][0]).toBe(testPid);
    });
  });
});
