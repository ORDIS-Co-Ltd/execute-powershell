import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { spawnPowerShell, SpawnPowerShellOptions, buildPowerShellCommand } from "../src/tools/process.js";

// Type for the mocked subprocess return value
type MockSubprocess = {
  stdout: ReadableStream<Uint8Array>;
  stderr: ReadableStream<Uint8Array>;
  stdin: { write: (data: Uint8Array) => void };
  exited: Promise<number>;
  pid: number;
};

describe("spawnPowerShell", () => {
  let originalBunSpawn: typeof Bun.spawn;
  let spawnMock: ReturnType<typeof mock>;

  beforeEach(() => {
    originalBunSpawn = Bun.spawn;
    spawnMock = mock(() => {
      return {
        stdout: new ReadableStream<Uint8Array>(),
        stderr: new ReadableStream<Uint8Array>(),
        stdin: { write: () => {} },
        exited: Promise.resolve(0),
        pid: 12345,
      } as unknown as ReturnType<typeof Bun.spawn>;
    });
    (Bun as unknown as { spawn: typeof spawnMock }).spawn = spawnMock;
  });

  afterEach(() => {
    (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
  });

  describe("spawn option payloads", () => {
    it("calls Bun.spawn with cmd from buildPowerShellCommand", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      expect(spawnMock).toHaveBeenCalledTimes(1);
      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
      expect(callArg.cmd).toEqual(buildPowerShellCommand("/usr/bin/pwsh"));
    });

    it("includes all expected PowerShell flags in cmd", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        command: "Get-Process",
        cwd: "C:\\Temp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
      expect(callArg.cmd).toEqual([
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "-",
      ]);
    });

    it("uses the provided cwd", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/custom/working/dir",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cwd: string };
      expect(callArg.cwd).toBe("/custom/working/dir");
    });

    it("sets stdout to pipe", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stdout: string };
      expect(callArg.stdout).toBe("pipe");
    });

    it("sets stderr to pipe", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stderr: string };
      expect(callArg.stderr).toBe("pipe");
    });

    it("sets windowsHide to true", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { windowsHide: boolean };
      expect(callArg.windowsHide).toBe(true);
    });

    it("passes AbortSignal when provided", () => {
      const controller = new AbortController();
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
        signal: controller.signal,
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { signal: AbortSignal };
      expect(callArg.signal).toBe(controller.signal);
    });

    it("does not include signal when not provided", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { signal?: AbortSignal };
      expect(callArg.signal).toBeUndefined();
    });
  });

  describe("stdin transport", () => {
    it("passes command text as Uint8Array in stdin option", () => {
      const scriptText = "Write-Host 'Hello World'";
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: scriptText,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stdin: Uint8Array };
      expect(callArg.stdin).toBeInstanceOf(Uint8Array);
    });

    it("encodes command text as UTF-8 in stdin", () => {
      const scriptText = "Write-Host 'Hello World'";
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: scriptText,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stdin: Uint8Array };
      const decoded = new TextDecoder().decode(callArg.stdin);
      expect(decoded).toBe(scriptText);
    });

    it("handles multi-line scripts in stdin", () => {
      const scriptText = `
        $name = "Test"
        Write-Host "Hello $name"
        Get-Process | Select-Object -First 5
      `.trim();
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: scriptText,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stdin: Uint8Array };
      const decoded = new TextDecoder().decode(callArg.stdin);
      expect(decoded).toBe(scriptText);
    });

    it("handles Unicode characters in stdin", () => {
      const scriptText = "Write-Host '🎉 Hello 世界'";
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: scriptText,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { stdin: Uint8Array };
      const decoded = new TextDecoder().decode(callArg.stdin);
      expect(decoded).toBe(scriptText);
    });
  });

  describe("security invariants", () => {
    it("does NOT include user script text in argv", () => {
      const maliciousScript = "Write-Host 'Hello'; Invoke-MaliciousCommand";
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: maliciousScript,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
      // Script text should never appear in cmd (argv)
      expect(callArg.cmd).not.toContain(maliciousScript);
      expect(callArg.cmd.some(arg => arg.includes("Write-Host"))).toBe(false);
      expect(callArg.cmd.some(arg => arg.includes("Invoke-MaliciousCommand"))).toBe(false);
    });

    it("cmd array always has exactly 5 elements regardless of script", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Some very long script with many commands; Do-This; Do-That; Get-Process",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
      expect(callArg.cmd).toHaveLength(5);
    });

    it("cmd ends with stdin marker (-)", () => {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'test'",
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
      expect(callArg.cmd[callArg.cmd.length - 1]).toBe("-");
    });
  });

  describe("return value", () => {
    it("returns the subprocess from Bun.spawn", () => {
      const mockSubprocess = {
        stdout: new ReadableStream<Uint8Array>(),
        stderr: new ReadableStream<Uint8Array>(),
        stdin: { write: () => {} },
        exited: Promise.resolve(0),
        pid: 12345,
      } as unknown as ReturnType<typeof Bun.spawn>;
      spawnMock.mockReturnValue(mockSubprocess);

      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: "Write-Host 'Hello'",
        cwd: "/tmp",
      };

      const result = spawnPowerShell(options);

      expect(result).toBe(mockSubprocess);
    });
  });
});
