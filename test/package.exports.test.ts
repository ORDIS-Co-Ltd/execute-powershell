import { describe, it, expect } from "bun:test";
import { ExecutePowerShellPlugin } from "../dist/index.js";

describe("package exports", () => {
  it("exports ExecutePowerShellPlugin from dist/index.js", () => {
    expect(ExecutePowerShellPlugin).toBeDefined();
  });

  it("ExecutePowerShellPlugin is a function", () => {
    expect(typeof ExecutePowerShellPlugin).toBe("function");
  });

  it("ExecutePowerShellPlugin is async callable", async () => {
    const result = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");
  });

  it("ExecutePowerShellPlugin returns a plugin with tool property", async () => {
    const result = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });
    expect(result.tool).toBeDefined();
    expect(result.tool!.execute_powershell).toBeDefined();
    expect(typeof result.tool!.execute_powershell).toBe("object");
  });
});
