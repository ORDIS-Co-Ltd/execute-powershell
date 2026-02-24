import { describe, it, expect } from "bun:test";
import { placeholder } from "../src/index";

describe("smoke test", () => {
  it("imports placeholder module", () => {
    expect(placeholder).toBe(true);
  });
});
