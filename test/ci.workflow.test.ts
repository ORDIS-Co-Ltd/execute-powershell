import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";
import yaml from "js-yaml";

const workflowPath = resolve(import.meta.dir, "../.github/workflows/ci.yml");

describe("CI workflow configuration", () => {
  it("exists at .github/workflows/ci.yml", () => {
    const content = readFileSync(workflowPath, "utf-8");
    expect(content).toBeTruthy();
  });

  it("is valid YAML", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content);
    expect(parsed).toBeDefined();
    expect(typeof parsed).toBe("object");
  });

  it("has name 'CI'", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    expect(parsed.name).toBe("CI");
  });

  it("triggers on push to main branch", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    expect(parsed.on).toBeDefined();
    const onTrigger = parsed.on as Record<string, unknown>;
    expect(onTrigger.push).toBeDefined();
    const pushTrigger = onTrigger.push as Record<string, string[]>;
    expect(pushTrigger.branches).toContain("main");
  });

  it("triggers on pull_request to main branch", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const onTrigger = parsed.on as Record<string, unknown>;
    expect(onTrigger.pull_request).toBeDefined();
    const prTrigger = onTrigger.pull_request as Record<string, string[]>;
    expect(prTrigger.branches).toContain("main");
  });

  it("has required jobs section", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    expect(parsed.jobs).toBeDefined();
    expect(typeof parsed.jobs).toBe("object");
  });

  it("has test job", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, unknown>;
    expect(jobs.test).toBeDefined();
  });

  it("runs on windows-latest", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown>>;
    expect(jobs.test["runs-on"]).toBe("windows-latest");
  });

  it("has required steps", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps;
    expect(steps).toBeDefined();
    expect(Array.isArray(steps)).toBe(true);
  });

  it("uses actions/checkout@v6", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const checkoutStep = steps.find((s) => s.uses === "actions/checkout@v6");
    expect(checkoutStep).toBeDefined();
  });

  it("uses oven-sh/setup-bun@v2", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const bunSetupStep = steps.find((s) => s.uses === "oven-sh/setup-bun@v2");
    expect(bunSetupStep).toBeDefined();
  });

  it("runs bun install step", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const installStep = steps.find(
      (s) => s.run === "bun install"
    );
    expect(installStep).toBeDefined();
  });

  it("runs bun test --coverage step", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const testStep = steps.find(
      (s) => s.run === "bun test --coverage"
    );
    expect(testStep).toBeDefined();
  });

  it("runs bun run build step", () => {
    const content = readFileSync(workflowPath, "utf-8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    const jobs = parsed.jobs as Record<string, Record<string, unknown[]>>;
    const steps = jobs.test.steps as Array<Record<string, unknown>>;
    const buildStep = steps.find(
      (s) => s.run === "bun run build"
    );
    expect(buildStep).toBeDefined();
  });

  it("runs bun run package:check step", () => {
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
