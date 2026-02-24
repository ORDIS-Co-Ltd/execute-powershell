import { describe, it, expect } from "bun:test";

describe("package directory import", () => {
  it("loads plugin from absolute package directory path", async () => {
    const mod = await import(process.cwd());

    expect(typeof mod.ExecutePowerShellPlugin).toBe("function");
  });
});
