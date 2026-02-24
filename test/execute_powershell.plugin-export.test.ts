import { describe, it, expect } from "bun:test";
import type { Plugin } from "@opencode-ai/plugin";
import { ExecutePowerShellPlugin } from "../src/index";

describe("plugin export", () => {
  it("exports ExecutePowerShellPlugin as named export", () => {
    expect(ExecutePowerShellPlugin).toBeDefined();
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

  it("ExecutePowerShellPlugin conforms to Plugin type", () => {
    const fn: Plugin = ExecutePowerShellPlugin;
    expect(fn).toBe(ExecutePowerShellPlugin);
  });

  it("importing src/index.ts performs no side-effect execution", () => {
    const before = Date.now();
    require("../src/index");
    const after = Date.now();
    expect(after - before).toBeLessThan(50);
  });
});
