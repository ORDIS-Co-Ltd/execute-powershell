import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const bunfigPath = resolve(import.meta.dir, "../bunfig.toml");

describe("bunfig coverage configuration", () => {
  it("has test section with coverage enabled", () => {
    const content = readFileSync(bunfigPath, "utf-8");

    expect(content).toContain("[test]");
    expect(content).toContain("coverage = true");
  });

  it("has coverageThreshold set to 1.0", () => {
    const content = readFileSync(bunfigPath, "utf-8");

    expect(content).toContain("coverageThreshold = 1.0");
  });

  it("ignores dist and tmp paths in coverage", () => {
    const content = readFileSync(bunfigPath, "utf-8");

    expect(content).toContain("coveragePathIgnorePatterns");
    expect(content).toContain("dist/**");
    expect(content).toContain("tmp/**");
  });
});
