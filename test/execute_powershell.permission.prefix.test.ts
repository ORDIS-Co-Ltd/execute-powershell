import { describe, it, expect } from "bun:test";
import { deriveAlwaysPattern } from "../src/tools/permissions";

describe("deriveAlwaysPattern", () => {
  describe("positive cases", () => {
    it("returns '<prefix> *' for simple command", () => {
      expect(deriveAlwaysPattern("Get-Process")).toBe("Get-Process *");
    });

    it("returns '<prefix> *' for command with arguments", () => {
      expect(deriveAlwaysPattern("Get-Process -Name chrome")).toBe("Get-Process *");
    });

    it("handles command with multiple arguments", () => {
      expect(deriveAlwaysPattern("Get-ChildItem -Path C:\\ -Recurse")).toBe("Get-ChildItem *");
    });

    it("trims leading whitespace", () => {
      expect(deriveAlwaysPattern("  Get-ChildItem")).toBe("Get-ChildItem *");
    });

    it("trims trailing whitespace", () => {
      expect(deriveAlwaysPattern("Get-ChildItem  ")).toBe("Get-ChildItem *");
    });

    it("trims both leading and trailing whitespace", () => {
      expect(deriveAlwaysPattern("  Get-ChildItem  ")).toBe("Get-ChildItem *");
    });

    it("handles tab characters as whitespace", () => {
      expect(deriveAlwaysPattern("\tGet-Process\t")).toBe("Get-Process *");
    });
  });

  describe("edge cases with '&' skip prefix", () => {
    it("skips leading '&' token", () => {
      expect(deriveAlwaysPattern("& script.ps1")).toBe("script.ps1 *");
    });

    it("skips leading '&' and returns script with arguments", () => {
      expect(deriveAlwaysPattern("& script.ps1 arg1 arg2")).toBe("script.ps1 *");
    });

    it("skips all leading '&' tokens", () => {
      expect(deriveAlwaysPattern("& & other.ps1")).toBe("other.ps1 *");
    });

    it("handles '&' with leading whitespace", () => {
      expect(deriveAlwaysPattern("  &  script.ps1")).toBe("script.ps1 *");
    });
  });

  describe("edge cases with '.' skip prefix", () => {
    it("skips leading '.' token (dot sourcing)", () => {
      expect(deriveAlwaysPattern(". script.ps1")).toBe("script.ps1 *");
    });

    it("skips leading '.' and returns script with arguments", () => {
      expect(deriveAlwaysPattern(". script.ps1 -Param value")).toBe("script.ps1 *");
    });

    it("skips all leading '.' tokens", () => {
      expect(deriveAlwaysPattern(". . other.ps1")).toBe("other.ps1 *");
    });

    it("handles '.' with leading whitespace", () => {
      expect(deriveAlwaysPattern("  .  script.ps1")).toBe("script.ps1 *");
    });
  });

  describe("edge cases with combined skip prefixes", () => {
    it("skips both '&' and '.' when both are leading", () => {
      expect(deriveAlwaysPattern("& . script.ps1")).toBe("script.ps1 *");
    });

    it("skips multiple leading skip tokens", () => {
      expect(deriveAlwaysPattern("& & . . script.ps1")).toBe("script.ps1 *");
    });

    it("handles mixed skip tokens with whitespace", () => {
      expect(deriveAlwaysPattern("  &  .  script.ps1")).toBe("script.ps1 *");
    });
  });

  describe("edge cases with paths that look like skip tokens", () => {
    it("treats './script.ps1' as the command (not a skip token)", () => {
      expect(deriveAlwaysPattern("./script.ps1 arg1")).toBe("./script.ps1 *");
    });

    it("treats '../script.ps1' as the command", () => {
      expect(deriveAlwaysPattern("../script.ps1")).toBe("../script.ps1 *");
    });

    it("treats '.\\script.ps1' as the command (Windows path)", () => {
      expect(deriveAlwaysPattern(".\\script.ps1")).toBe(".\\script.ps1 *");
    });

    it("treats '...' as the command (not skip tokens)", () => {
      expect(deriveAlwaysPattern("... some-arg")).toBe("... *");
    });
  });

  describe("edge cases with special characters", () => {
    it("handles command with special PowerShell characters", () => {
      expect(deriveAlwaysPattern("Write-Host $env:PATH")).toBe("Write-Host *");
    });

    it("handles command with pipeline", () => {
      expect(deriveAlwaysPattern("Get-Process | Where-Object { $_.WorkingSet -gt 100MB }")).toBe("Get-Process *");
    });

    it("handles empty string", () => {
      expect(deriveAlwaysPattern("")).toBe("* *");
    });

    it("handles whitespace-only string", () => {
      expect(deriveAlwaysPattern("   ")).toBe("* *");
    });

    it("handles string with only skip tokens", () => {
      expect(deriveAlwaysPattern("& .")).toBe("* *");
    });

    it("handles string with multiple whitespace between tokens", () => {
      expect(deriveAlwaysPattern("Get-Process    -Name    chrome")).toBe("Get-Process *");
    });
  });

  describe("real-world PowerShell command patterns", () => {
    it("handles Invoke-Expression", () => {
      expect(deriveAlwaysPattern("Invoke-Expression 'Get-Process'")).toBe("Invoke-Expression *");
    });

    it("handles Start-Process", () => {
      expect(deriveAlwaysPattern("Start-Process notepad -Wait")).toBe("Start-Process *");
    });

    it("handles New-Item", () => {
      expect(deriveAlwaysPattern("New-Item -Path 'file.txt' -ItemType File")).toBe("New-Item *");
    });

    it("handles script invocation with &", () => {
      expect(deriveAlwaysPattern("& 'C:\\Program Files\\script.ps1' -Verbose")).toBe("'C:\\Program *");
    });
  });
});
