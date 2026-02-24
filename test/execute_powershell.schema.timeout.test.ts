import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { argsSchema } from "../src/tools/execute_powershell";

const schema = z.object(argsSchema);

describe("timeout argument schema", () => {
  it("defaults timeout_ms to 120000 when omitted", () => {
    const result = schema.parse({
      command: "echo test",
      description: "test command",
    });
    expect(result.timeout_ms).toBe(120000);
  });

  it("accepts timeout_ms = 0", () => {
    const result = schema.parse({
      command: "echo test",
      description: "test command",
      timeout_ms: 0,
    });
    expect(result.timeout_ms).toBe(0);
  });

  it("rejects negative timeout_ms", () => {
    const result = schema.safeParse({
      command: "echo test",
      description: "test command",
      timeout_ms: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Too small|greater than or equal to/);
    }
  });

  it("rejects non-integer timeout_ms", () => {
    const result = schema.safeParse({
      command: "echo test",
      description: "test command",
      timeout_ms: 123.456,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/Invalid input|integer/);
    }
  });

  it("accepts positive integer timeout_ms", () => {
    const result = schema.parse({
      command: "echo test",
      description: "test command",
      timeout_ms: 5000,
    });
    expect(result.timeout_ms).toBe(5000);
  });
});