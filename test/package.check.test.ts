import { describe, it, expect } from "bun:test";
import {
  validatePackFiles,
  REQUIRED_FILES,
  type PackResult,
} from "../scripts/package-check";

const validPackResult: PackResult[] = [
  {
    files: REQUIRED_FILES.map((path) => ({ path })),
  },
];

const missingReadmePackResult: PackResult[] = [
  {
    files: REQUIRED_FILES.filter((f) => f !== "README.md").map((path) => ({
      path,
    })),
  },
];

const missingDistPackResult: PackResult[] = [
  {
    files: REQUIRED_FILES.filter(
      (f) => f !== "dist/index.js" && f !== "dist/index.d.ts"
    ).map((path) => ({ path })),
  },
];

describe("validatePackFiles", () => {
  it("returns empty array when all files present", () => {
    const missing = validatePackFiles(validPackResult);
    expect(missing).toEqual([]);
  });

  it("returns missing files when README.md absent", () => {
    const missing = validatePackFiles(missingReadmePackResult);
    expect(missing).toContain("README.md");
    expect(missing).toHaveLength(1);
  });

  it("returns missing files when dist files absent", () => {
    const missing = validatePackFiles(missingDistPackResult);
    expect(missing).toContain("dist/index.js");
    expect(missing).toContain("dist/index.d.ts");
    expect(missing).toHaveLength(2);
  });

  it("returns all required files when pack result is empty", () => {
    const emptyPackResult: PackResult[] = [{ files: [] }];
    const missing = validatePackFiles(emptyPackResult);
    expect(missing).toEqual(REQUIRED_FILES);
  });
});
