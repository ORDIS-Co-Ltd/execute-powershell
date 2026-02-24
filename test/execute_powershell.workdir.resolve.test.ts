import { describe, it, expect } from "bun:test";
import path from "path";
import { resolveWorkdir } from "../src/tools/workdir";

describe("resolveWorkdir", () => {
  const contextDir = "/home/user/project";

  describe("omitted workdir (defaults to context directory)", () => {
    it("returns contextDirectory when workdirArg is undefined", () => {
      const result = resolveWorkdir(contextDir, undefined);
      expect(result).toBe(contextDir);
    });

    it("returns contextDirectory when workdirArg is omitted", () => {
      const result = resolveWorkdir(contextDir);
      expect(result).toBe(contextDir);
    });
  });

  describe("relative paths", () => {
    it("resolves './subdir' to absolute path within context", () => {
      const result = resolveWorkdir(contextDir, "./subdir");
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe("/home/user/project/subdir");
    });

    it("resolves 'subdir' (without ./) to absolute path within context", () => {
      const result = resolveWorkdir(contextDir, "subdir");
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe("/home/user/project/subdir");
    });

    it("resolves '../sibling' to absolute path outside context", () => {
      const result = resolveWorkdir(contextDir, "../sibling");
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe("/home/user/sibling");
    });

    it("resolves '.' to contextDirectory", () => {
      const result = resolveWorkdir(contextDir, ".");
      expect(result).toBe(contextDir);
    });

    it("resolves nested relative paths", () => {
      const result = resolveWorkdir(contextDir, "./a/b/c");
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toBe("/home/user/project/a/b/c");
    });

    it("handles Windows-style relative paths on Unix", () => {
      const result = resolveWorkdir(contextDir, "subdir\\nested");
      // path.resolve handles both separators on all platforms
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe("absolute paths", () => {
    it("returns absolute path as-is (Unix)", () => {
      const absolutePath = "/var/log/system";
      const result = resolveWorkdir(contextDir, absolutePath);
      expect(result).toBe(absolutePath);
    });

    it("handles Windows-style paths as relative on Unix platforms", () => {
      // Windows paths are treated as relative on Unix because path.isAbsolute()
      // returns false for Windows-style paths on Unix platforms
      const windowsPath = "C:\\Windows\\System32";
      const result = resolveWorkdir(contextDir, windowsPath);
      // On Unix, this resolves to a path within contextDir
      // On Windows, this would return the absolute path normalized
      expect(path.isAbsolute(result)).toBe(true);
    });

    it("normalizes redundant separators in absolute path", () => {
      const result = resolveWorkdir(contextDir, "/var//log//system");
      expect(result).toBe("/var/log/system");
    });

    it("normalizes '..' in absolute path", () => {
      const result = resolveWorkdir(contextDir, "/var/log/../system");
      expect(result).toBe("/var/system");
    });

    it("normalizes '.' in absolute path", () => {
      const result = resolveWorkdir(contextDir, "/var/./log/./system");
      expect(result).toBe("/var/log/system");
    });

    it("handles trailing slash in absolute path", () => {
      const result = resolveWorkdir(contextDir, "/var/log/");
      // Note: path.normalize behavior for trailing slashes varies by platform
      // On Unix, trailing slash is often preserved; on Windows, it may be removed
      expect(path.isAbsolute(result)).toBe(true);
      // Result should either be "/var/log" or "/var/log/" depending on platform
      expect(result === "/var/log" || result === "/var/log/").toBe(true);
    });
  });

  describe("deterministic resolution", () => {
    it("returns same result for same inputs (idempotent)", () => {
      const result1 = resolveWorkdir(contextDir, "./subdir");
      const result2 = resolveWorkdir(contextDir, "./subdir");
      expect(result1).toBe(result2);
    });

    it("handles different context directories independently", () => {
      const result1 = resolveWorkdir("/home/user/project1", "./subdir");
      const result2 = resolveWorkdir("/home/user/project2", "./subdir");
      expect(result1).toBe("/home/user/project1/subdir");
      expect(result2).toBe("/home/user/project2/subdir");
    });
  });

  describe("edge cases", () => {
    it("handles empty string as relative path", () => {
      // Empty string is treated as relative and resolves to contextDir
      const result = resolveWorkdir(contextDir, "");
      expect(result).toBe(contextDir);
    });

    it("handles path with only separators", () => {
      const result = resolveWorkdir(contextDir, "/");
      expect(result).toBe("/");
    });

    it("resolves multiple level parent traversal", () => {
      const result = resolveWorkdir("/a/b/c", "../../d");
      expect(result).toBe("/a/d");
    });
  });
});
