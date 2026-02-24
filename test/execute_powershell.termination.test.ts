import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { terminateProcessTree } from "../src/tools/process.js";

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
});
