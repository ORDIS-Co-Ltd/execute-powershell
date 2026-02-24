import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { resolvePowerShellExecutable, type PowerShellExecutable } from "../src/tools/powershell_exe";

describe("resolvePowerShellExecutable", () => {
  let whichSpy: ReturnType<typeof spyOn<typeof Bun, "which">>;

  beforeEach(() => {
    whichSpy = spyOn(Bun, "which");
  });

  afterEach(() => {
    whichSpy.mockRestore();
  });

  describe("precedence", () => {
    it("prefers pwsh over powershell.exe when both exist", () => {
      whichSpy.mockImplementation((cmd: string) => {
        if (cmd === "pwsh") return "/usr/bin/pwsh";
        if (cmd === "powershell.exe") return "/usr/bin/powershell.exe";
        return null;
      });

      const result: PowerShellExecutable = resolvePowerShellExecutable();

      expect(result.kind).toBe("pwsh");
      expect(result.path).toBe("/usr/bin/pwsh");
    });

    it("returns pwsh when only pwsh exists", () => {
      whichSpy.mockImplementation((cmd: string) => {
        if (cmd === "pwsh") return "/opt/pwsh/pwsh";
        return null;
      });

      const result: PowerShellExecutable = resolvePowerShellExecutable();

      expect(result.kind).toBe("pwsh");
      expect(result.path).toBe("/opt/pwsh/pwsh");
    });

    it("returns powershell.exe when only powershell.exe exists", () => {
      whichSpy.mockImplementation((cmd: string) => {
        if (cmd === "powershell.exe") return "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        return null;
      });

      const result: PowerShellExecutable = resolvePowerShellExecutable();

      expect(result.kind).toBe("powershell");
      expect(result.path).toBe("C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe");
    });

    it("checks pwsh first before powershell.exe", () => {
      const calls: string[] = [];
      whichSpy.mockImplementation((cmd: string) => {
        calls.push(cmd);
        if (cmd === "pwsh") return "/usr/bin/pwsh";
        if (cmd === "powershell.exe") return "/usr/bin/powershell.exe";
        return null;
      });

      resolvePowerShellExecutable();

      expect(calls).toEqual(["pwsh"]); // Should not check powershell.exe after finding pwsh
    });
  });

  describe("error handling", () => {
    it("throws clear error when neither executable exists", () => {
      whichSpy.mockImplementation(() => null);

      expect(() => resolvePowerShellExecutable()).toThrow(
        "PowerShell not found. Please install PowerShell (pwsh) or Windows PowerShell (powershell.exe)."
      );
    });

    it("throws error after checking both executables", () => {
      const calls: string[] = [];
      whichSpy.mockImplementation((cmd: string) => {
        calls.push(cmd);
        return null;
      });

      try {
        resolvePowerShellExecutable();
      } catch {
        // Expected to throw
      }

      expect(calls).toEqual(["pwsh", "powershell.exe"]);
    });
  });

  describe("return value", () => {
    it("returns correct interface for pwsh", () => {
      whichSpy.mockImplementation((cmd: string) => {
        if (cmd === "pwsh") return "/usr/local/bin/pwsh";
        return null;
      });

      const result: PowerShellExecutable = resolvePowerShellExecutable();

      expect(result).toHaveProperty("kind");
      expect(result).toHaveProperty("path");
      expect(result.kind).toBe("pwsh");
      expect(typeof result.path).toBe("string");
    });

    it("returns correct interface for powershell.exe", () => {
      whichSpy.mockImplementation((cmd: string) => {
        if (cmd === "powershell.exe") return "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        return null;
      });

      const result: PowerShellExecutable = resolvePowerShellExecutable();

      expect(result).toHaveProperty("kind");
      expect(result).toHaveProperty("path");
      expect(result.kind).toBe("powershell");
      expect(typeof result.path).toBe("string");
    });
  });
});
