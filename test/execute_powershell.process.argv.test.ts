import { describe, it, expect } from "bun:test";
import { buildPowerShellCommand } from "../src/tools/process";

describe("buildPowerShellCommand", () => {
  describe("argv invariants", () => {
    it("returns exact expected sequence for pwsh", () => {
      const exePath = "/usr/bin/pwsh";
      const argv = buildPowerShellCommand(exePath);

      expect(argv).toEqual([
        "/usr/bin/pwsh",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "-"
      ]);
    });

    it("returns exact expected sequence for powershell.exe", () => {
      const exePath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
      const argv = buildPowerShellCommand(exePath);

      expect(argv).toEqual([
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        "-NoProfile",
        "-NonInteractive",
        "-Command",
        "-"
      ]);
    });

    it("includes -NoProfile flag", () => {
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      expect(argv).toContain("-NoProfile");
    });

    it("includes -NonInteractive flag", () => {
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      expect(argv).toContain("-NonInteractive");
    });

    it("includes -Command flag", () => {
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      expect(argv).toContain("-Command");
    });

    it("includes stdin marker (-) as last argument", () => {
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      expect(argv[argv.length - 1]).toBe("-");
    });
  });

  describe("security invariants", () => {
    it("does NOT include user script text in argv", () => {
      const maliciousScript = "Write-Host 'Hello'; Invoke-MaliciousCommand";
      const argv = buildPowerShellCommand("/usr/bin/pwsh");

      // User script should never appear in argv - it must be passed via stdin
      expect(argv).not.toContain(maliciousScript);
      expect(argv.some(arg => arg.includes("Write-Host"))).toBe(false);
      expect(argv.some(arg => arg.includes("Invoke-MaliciousCommand"))).toBe(false);
    });

    it("does NOT accept script text as parameter", () => {
      // The function signature only accepts exePath, not script text
      // This is a compile-time check - if this compiles, the API is correct
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      expect(argv).toHaveLength(5);
    });

    it("has fixed argv length regardless of input", () => {
      const argv1 = buildPowerShellCommand("/usr/bin/pwsh");
      const argv2 = buildPowerShellCommand("C:\\Windows\\powershell.exe");

      expect(argv1).toHaveLength(5);
      expect(argv2).toHaveLength(5);
    });

    it("argv only contains expected flags", () => {
      const argv = buildPowerShellCommand("/usr/bin/pwsh");
      const expectedFlags = ["-NoProfile", "-NonInteractive", "-Command", "-"];
      
      // First element is exePath, rest should be only the expected flags
      const flags = argv.slice(1);
      expect(flags).toEqual(expectedFlags);
    });
  });
});
