import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import {
  validatePackFiles,
  runCheck,
  main,
  REQUIRED_FILES,
  type PackResult,
} from "../scripts/package-check";

// Explicit fixture with hardcoded expected files (not derived from REQUIRED_FILES)
const expectedFiles = [
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "LICENSE",
  "package.json",
];

const validPackResult: PackResult[] = [
  {
    files: expectedFiles.map((path) => ({ path })),
  },
];

const missingReadmePackResult: PackResult[] = [
  {
    files: expectedFiles
      .filter((f) => f !== "README.md")
      .map((path) => ({ path })),
  },
];

const missingDistPackResult: PackResult[] = [
  {
    files: expectedFiles
      .filter((f) => f !== "dist/index.js" && f !== "dist/index.d.ts")
      .map((path) => ({ path })),
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

  it("returns all required files when pack result is null", () => {
    const missing = validatePackFiles(null as unknown as PackResult[]);
    expect(missing).toEqual(REQUIRED_FILES);
  });

  it("returns all required files when pack result is undefined", () => {
    const missing = validatePackFiles(undefined as unknown as PackResult[]);
    expect(missing).toEqual(REQUIRED_FILES);
  });

  it("returns all required files when pack result[0] is missing", () => {
    const missing = validatePackFiles([]);
    expect(missing).toEqual(REQUIRED_FILES);
  });

  it("returns all required files when pack result[0].files is missing", () => {
    const malformedPackResult: PackResult[] = [{} as PackResult];
    const missing = validatePackFiles(malformedPackResult);
    expect(missing).toEqual(REQUIRED_FILES);
  });
});

describe("runCheck", () => {
  it("returns result object with success and missing properties", async () => {
    const result = await runCheck();
    // This test runs actual npm pack, so we just verify the shape
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("missing");
    expect(Array.isArray(result.missing)).toBe(true);
    expect(typeof result.success).toBe("boolean");
  });

  it("handles JSON parse errors gracefully", async () => {
    // Mock Bun.spawn to return invalid JSON
    const spawnSpy = spyOn(Bun, "spawn").mockReturnValue({
      stdout: {
        [Symbol.asyncIterator]: async function* () {
          yield new TextEncoder().encode("invalid json");
        },
      },
    } as unknown as ReturnType<typeof Bun.spawn>);

    const result = await runCheck();

    expect(result.success).toBe(false);
    expect(result.missing).toEqual(REQUIRED_FILES);

    spawnSpy.mockRestore();
  });
});

describe("main", () => {
  let exitSpy: ReturnType<typeof spyOn>;
  let errorSpy: ReturnType<typeof spyOn>;
  let logSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    exitSpy = spyOn(process, "exit").mockImplementation((code?: number) => {
      throw new Error(`process.exit(${code})`);
    });
    errorSpy = spyOn(console, "error").mockImplementation(() => {});
    logSpy = spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("logs success message when check succeeds", async () => {
    const mockCheck = async () => ({ success: true, missing: [] as string[] });

    await main(mockCheck);

    expect(logSpy).toHaveBeenCalledWith("✓ All required files present");
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("logs error and exits with code 1 when check fails", async () => {
    const mockCheck = async () => ({
      success: false,
      missing: ["README.md"],
    });

    await expect(main(mockCheck)).rejects.toThrow("process.exit(1)");

    expect(errorSpy).toHaveBeenCalledWith("Missing required files:", ["README.md"]);
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
