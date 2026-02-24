import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const packageJsonPath = resolve(import.meta.dir, "../package.json");

describe("package manifest", () => {
  it("has required fields", () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(pkg.name).toBeDefined();
    expect(pkg.version).toBeDefined();
    expect(pkg.type).toBe("module");
    expect(pkg.packageManager).toBeDefined();
  });

  it("pins correct dependency versions", () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(pkg.dependencies?.["@opencode-ai/plugin"]).toBe("1.2.10");
    expect(pkg.dependencies?.zod).toBe("4.3.6");
    expect(pkg.devDependencies?.typescript).toBe("5.9.3");
    expect(pkg.devDependencies?.["@types/bun"]).toBe("1.3.9");
  });

  it("has required scripts", () => {
    const pkg = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    expect(pkg.scripts?.test).toBeDefined();
    expect(pkg.scripts?.build).toBeDefined();
    expect(pkg.scripts?.["package:check"]).toBeDefined();
  });
});
