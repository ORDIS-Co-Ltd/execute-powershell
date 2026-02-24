import { describe, it, expect } from "bun:test";
import { buildPowerShellCommand } from "../src/tools/process.js";

describe("buildPowerShellCommand", () => {
  it("returns correct argv sequence", () => {
    const result = buildPowerShellCommand("/usr/bin/pwsh");
    expect(result).toEqual([
      "/usr/bin/pwsh",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "-",
    ]);
  });

  it("includes -NoProfile flag", () => {
    const result = buildPowerShellCommand("pwsh");
    expect(result).toContain("-NoProfile");
  });

  it("includes -NonInteractive flag", () => {
    const result = buildPowerShellCommand("pwsh");
    expect(result).toContain("-NonInteractive");
  });

  it("includes -Command flag", () => {
    const result = buildPowerShellCommand("pwsh");
    expect(result).toContain("-Command");
  });

  it("includes - for stdin", () => {
    const result = buildPowerShellCommand("pwsh");
    expect(result).toContain("-");
  });

  it("does not accept user script text", () => {
    // Function signature only accepts exePath, not script text
    const result = buildPowerShellCommand("pwsh");
    expect(result).toHaveLength(5);
    expect(result).not.toContain("Get-Process");
    expect(result).not.toContain("Write-Host");
  });
});
