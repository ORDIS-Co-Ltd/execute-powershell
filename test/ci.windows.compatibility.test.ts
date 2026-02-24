import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

const workflowPath = resolve(import.meta.dir, "../.github/workflows/ci.yml");

describe("CI Windows compatibility matrix", () => {
  it("contains both Windows 10 and Windows 11 targets", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown>>;
    const strategy = jobs.test.strategy as Record<string, unknown>;
    const matrix = strategy.matrix as Record<string, string[]>;
    const os = matrix.os;

    expect(os).toContain("windows-2022");
    expect(os).toContain("windows-2019");
  });

  it("runs on matrix.os", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown>>;
    expect(jobs.test["runs-on"]).toBe("${{ matrix.os }}");
  });

  it("runs integration tests step on all Windows versions", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const testStep = steps.find(
      (s) => s.run === "bun test --coverage"
    );
    expect(testStep).toBeDefined();
  });

  it("runs build step on all Windows versions", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const buildStep = steps.find(
      (s) => s.run === "bun run build"
    );
    expect(buildStep).toBeDefined();
  });

  it("runs package:check step on all Windows versions", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const packageCheckStep = steps.find(
      (s) => s.run === "bun run package:check"
    );
    expect(packageCheckStep).toBeDefined();
  });
});
