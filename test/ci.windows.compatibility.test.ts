import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

const workflowPath = resolve(import.meta.dir, "../.github/workflows/ci.yml");

describe("CI Windows compatibility matrix", () => {
  it("includes windows-11 compatibility lane", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown>>;
    const strategy = jobs.test.strategy as Record<string, unknown>;
    const matrix = strategy.matrix as { include: Array<{ compatibility: string; os: string }> };
    const win11 = matrix.include.find(m => m.compatibility === "windows-11");
    expect(win11).toBeDefined();
    expect(win11?.os).toBe("windows-2022");
  });

  it("includes windows-10 compatibility lane", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown>>;
    const strategy = jobs.test.strategy as Record<string, unknown>;
    const matrix = strategy.matrix as { include: Array<{ compatibility: string; os: string }> };
    const win10 = matrix.include.find(m => m.compatibility === "windows-10");
    expect(win10).toBeDefined();
    expect(win10?.os).toBe("windows-2019");
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
