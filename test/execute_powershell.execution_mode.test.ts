import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { spawnPowerShell, SpawnPowerShellOptions, buildPowerShellCommand } from "../src/tools/process.js";

describe("Execution-Mode Compliance", () => {
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

  it("uses -Command - for stdin transport", () => {
    const options: SpawnPowerShellOptions = {
      exePath: "/usr/bin/pwsh",
      command: "Write-Host 'test'",
      cwd: "/tmp",
    };

    spawnPowerShell(options);

    const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
    const argv = callArg.cmd;

    // Verify argv has -Command
    expect(argv).toContain("-Command");
    // Verify argv ends with -
    expect(argv[argv.length - 1]).toBe("-");
    // Verify -Command is at index 3 (0: exePath, 1: -NoProfile, 2: -NonInteractive, 3: -Command, 4: -)
    expect(argv[3]).toBe("-Command");
  });

  it("excludes -EncodedCommand", () => {
    const options: SpawnPowerShellOptions = {
      exePath: "/usr/bin/pwsh",
      command: "Write-Host 'test'",
      cwd: "/tmp",
    };

    spawnPowerShell(options);

    const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
    const argv = callArg.cmd;

    // Verify no -EncodedCommand in argv
    expect(argv).not.toContain("-EncodedCommand");
    expect(argv.some(arg => arg.toLowerCase().includes("encodedcommand"))).toBe(false);
    expect(argv.some(arg => arg.toLowerCase().includes("-e"))).toBe(false);
    expect(argv.some(arg => arg.toLowerCase().includes("-ec"))).toBe(false);
  });

  it("does not include script text in argv", () => {
    const userScript = "Write-Host 'Secret Command'; Get-Process";
    const options: SpawnPowerShellOptions = {
      exePath: "/usr/bin/pwsh",
      command: userScript,
      cwd: "/tmp",
    };

    spawnPowerShell(options);

    const callArg = spawnMock.mock.calls[0][0] as { cmd: string[]; stdin: Uint8Array };
    const argv = callArg.cmd;
    const stdin = callArg.stdin;

    // Verify command text not in argv
    expect(argv).not.toContain(userScript);
    expect(argv.some(arg => arg.includes("Write-Host"))).toBe(false);
    expect(argv.some(arg => arg.includes("Secret Command"))).toBe(false);
    expect(argv.some(arg => arg.includes("Get-Process"))).toBe(false);

    // Verify command text in stdin
    const decodedStdin = new TextDecoder().decode(stdin);
    expect(decodedStdin).toBe(userScript);
  });

  it("verifies argv structure matches buildPowerShellCommand output", () => {
    const options: SpawnPowerShellOptions = {
      exePath: "/usr/bin/pwsh",
      command: "Write-Host 'test'",
      cwd: "/tmp",
    };

    spawnPowerShell(options);

    const callArg = spawnMock.mock.calls[0][0] as { cmd: string[] };
    const expectedArgv = buildPowerShellCommand("/usr/bin/pwsh");

    expect(callArg.cmd).toEqual(expectedArgv);
    expect(callArg.cmd).toEqual([
      "/usr/bin/pwsh",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "-",
    ]);
  });

  it("excludes -EncodedCommand for all script variations", () => {
    const testScripts = [
      "Write-Host 'simple'",
      "Get-Process | Where-Object { $_.Name -like '*test*' }",
      "Invoke-Expression 'malicious code'",
      "-EncodedCommand abc123",
      "-e base64encodedstring",
    ];

    for (const script of testScripts) {
      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: script,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[spawnMock.mock.calls.length - 1][0] as { cmd: string[] };
      const argv = callArg.cmd;

      // argv should never contain -EncodedCommand regardless of script content
      expect(argv).not.toContain("-EncodedCommand");
      expect(argv.length).toBe(5);
    }
  });

  it("ensures script text is only in stdin, never in argv", () => {
    const testScripts = [
      "Write-Host 'Hello World'",
      "$password = 'secret123'; Write-Host $password",
      "Invoke-MaliciousCommand -Arg1 'value1'",
      `Get-Content "C:\\Users\\Test\\file.txt"`,
    ];

    for (const script of testScripts) {
      // Reset mock to get fresh calls
      spawnMock.mockClear();

      const options: SpawnPowerShellOptions = {
        exePath: "/usr/bin/pwsh",
        command: script,
        cwd: "/tmp",
      };

      spawnPowerShell(options);

      const callArg = spawnMock.mock.calls[0][0] as { cmd: string[]; stdin: Uint8Array };
      const argv = callArg.cmd;
      const stdin = callArg.stdin;

      // Script should NOT be in any argv element
      for (const arg of argv) {
        expect(arg).not.toBe(script);
        expect(arg).not.toContain(script.substring(0, 20)); // Check first 20 chars
      }

      // Script SHOULD be in stdin
      const decodedStdin = new TextDecoder().decode(stdin);
      expect(decodedStdin).toBe(script);
    }
  });
});
