import { describe, it, expect } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index";

describe("smoke test", () => {
  it("imports plugin module", () => {
    expect(ExecutePowerShellPlugin).toBeDefined();
  });
});
