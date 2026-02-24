import { describe, it, expect } from "bun:test";
import { main } from "../scripts/package-check";

// Mock payloads for testing
const validPackResult = [
  {
    files: [
      { path: "dist/index.js" },
      { path: "dist/index.d.ts" },
      { path: "README.md" },
      { path: "LICENSE" },
      { path: "package.json" },
    ],
  },
];

const missingReadmePackResult = [
  {
    files: [
      { path: "dist/index.js" },
      { path: "dist/index.d.ts" },
      { path: "LICENSE" },
      { path: "package.json" },
    ],
  },
];

const missingDistPackResult = [
  {
    files: [
      { path: "README.md" },
      { path: "LICENSE" },
      { path: "package.json" },
    ],
  },
];

describe("package-check", () => {
  it("should validate all required files are present", async () => {
    // This test will run the actual package check against the real project
    // and will pass if all required files are in the package
    try {
      await main();
      // If we get here without an error, all files are present
      expect(true).toBe(true);
    } catch (err) {
      // The main function calls process.exit(1) which throws an error in Bun
      throw err;
    }
  });
});
