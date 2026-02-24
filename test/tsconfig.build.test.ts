import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { resolve } from "path";

const tsconfigPath = resolve(import.meta.dir, "../tsconfig.json");

describe("tsconfig build configuration", () => {
  it("has ESM module settings", () => {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

    expect(tsconfig.compilerOptions?.module).toBe("NodeNext");
    expect(tsconfig.compilerOptions?.moduleResolution).toBe("NodeNext");
  });

  it("emits declarations", () => {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

    expect(tsconfig.compilerOptions?.declaration).toBe(true);
    expect(tsconfig.compilerOptions?.declarationMap).toBe(true);
  });

  it("outputs to dist directory", () => {
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));

    expect(tsconfig.compilerOptions?.outDir).toBe("./dist");
  });
});
