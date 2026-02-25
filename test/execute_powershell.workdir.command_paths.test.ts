import { describe, it, expect } from "bun:test";
import os from "node:os";
import path from "node:path";
import { extractPowerShellCommandDirectories } from "../src/tools/workdir.js";

describe("extractPowerShellCommandDirectories", () => {
  const cwd = "/home/user/project";

  it("extracts external directory from -Path argument", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content -Path '/var/log/system.log'",
      cwd
    );

    expect(dirs).toContain("/var/log");
  });

  it("extracts relative path arguments against cwd", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content ./logs/app.log",
      cwd
    );

    expect(dirs).toContain("/home/user/project/logs");
  });

  it("extracts inline path parameters", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content -Path:/etc/hosts",
      cwd
    );

    expect(dirs).toContain("/etc");
  });

  it("extracts path arguments across pipeline segments", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content /var/log/a.txt | Set-Content /var/log/b.txt",
      cwd
    );

    expect(dirs).toContain("/var/log");
  });

  it("ignores non path-aware commands", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Process -Name chrome",
      cwd
    );

    expect(dirs).toEqual([]);
  });

  it("ignores PowerShell provider paths", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content HKLM:\\Software\\MyKey",
      cwd
    );

    expect(dirs).toEqual([]);
  });

  it("resolves ~/ paths against home directory", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content ~/Documents/report.txt",
      cwd
    );

    expect(dirs).toContain(path.join(os.homedir(), "Documents"));
  });

  it("resolves $HOME paths against home directory", () => {
    const dirs = extractPowerShellCommandDirectories(
      "Get-Content $HOME/Documents/report.txt",
      cwd
    );

    expect(dirs).toContain(path.join(os.homedir(), "Documents"));
  });
});
