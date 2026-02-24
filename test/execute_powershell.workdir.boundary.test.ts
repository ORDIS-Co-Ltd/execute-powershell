import { describe, it, expect } from "bun:test";
import path from "path";
import { isWithinBoundary, buildAllowedRoots } from "../src/tools/workdir";
import type { ToolContext } from "@opencode-ai/plugin/tool";

describe("isWithinBoundary", () => {
  describe("single root boundary", () => {
    const allowedRoots = ["/home/user/project"];

    it("returns true for exact root match", () => {
      const result = isWithinBoundary("/home/user/project", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns true for path inside root (single level)", () => {
      const result = isWithinBoundary("/home/user/project/src", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns true for path inside root (nested)", () => {
      const result = isWithinBoundary(
        "/home/user/project/src/components/Button",
        allowedRoots
      );
      expect(result).toBe(true);
    });

    it("returns false for path outside root (sibling)", () => {
      const result = isWithinBoundary("/home/user/other-project", allowedRoots);
      expect(result).toBe(false);
    });

    it("returns false for path outside root (parent)", () => {
      const result = isWithinBoundary("/home/user", allowedRoots);
      expect(result).toBe(false);
    });

    it("returns false for path with similar prefix", () => {
      const result = isWithinBoundary("/home/user/project-backup", allowedRoots);
      expect(result).toBe(false);
    });

    it("returns false for completely different path", () => {
      const result = isWithinBoundary("/var/log", allowedRoots);
      expect(result).toBe(false);
    });
  });

  describe("multiple roots boundary", () => {
    const allowedRoots = ["/home/user/project", "/home/user/worktree"];

    it("returns true for first root (exact match)", () => {
      const result = isWithinBoundary("/home/user/project", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns true for second root (exact match)", () => {
      const result = isWithinBoundary("/home/user/worktree", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns true for path inside first root", () => {
      const result = isWithinBoundary("/home/user/project/src", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns true for path inside second root", () => {
      const result = isWithinBoundary("/home/user/worktree/test", allowedRoots);
      expect(result).toBe(true);
    });

    it("returns false for path outside both roots", () => {
      const result = isWithinBoundary("/home/user/other", allowedRoots);
      expect(result).toBe(false);
    });
  });

  describe("path normalization", () => {
    const allowedRoots = ["/home/user/project"];

    it("normalizes path with redundant separators", () => {
      const result = isWithinBoundary("/home/user//project//src", allowedRoots);
      expect(result).toBe(true);
    });

    it("normalizes root with redundant separators", () => {
      const result = isWithinBoundary("/home/user/project/src", [
        "/home/user//project",
      ]);
      expect(result).toBe(true);
    });

    it("handles path with dot segments", () => {
      const result = isWithinBoundary(
        "/home/user/project/./src",
        allowedRoots
      );
      expect(result).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("returns false for empty allowed roots", () => {
      const result = isWithinBoundary("/home/user/project", []);
      expect(result).toBe(false);
    });

    it("handles root path (Unix)", () => {
      const result = isWithinBoundary("/", ["/"]);
      expect(result).toBe(true);
    });

    it("handles root path with subdir", () => {
      const result = isWithinBoundary("/home", ["/"]);
      expect(result).toBe(true);
    });

    it("handles paths that look similar but are different", () => {
      const allowedRoots = ["/home/user/project"];
      const result = isWithinBoundary("/home/user/projects", allowedRoots);
      expect(result).toBe(false);
    });

    it("handles paths with trailing separator on root", () => {
      const allowedRoots = ["/home/user/project/"];
      const result = isWithinBoundary("/home/user/project/src", allowedRoots);
      expect(result).toBe(true);
    });
  });

  describe("platform considerations", () => {
    it("uses correct path separator for boundary check", () => {
      // This test documents that we use path.sep for separator
      // On Unix: "/", on Windows: "\\"
      const allowedRoots = ["/home/user/project"];
      const result = isWithinBoundary("/home/user/project/src", allowedRoots);
      expect(result).toBe(true);
    });
  });
});

describe("buildAllowedRoots", () => {
  it("includes context.directory always", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/",
    } as ToolContext;

    const roots = buildAllowedRoots(context);
    expect(roots).toContain("/home/user/project");
    expect(roots).toHaveLength(1);
  });

  it("includes worktree when it is not root", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/home/user/project/.worktrees/task-012",
    } as ToolContext;

    const roots = buildAllowedRoots(context);
    expect(roots).toContain("/home/user/project");
    expect(roots).toContain("/home/user/project/.worktrees/task-012");
    expect(roots).toHaveLength(2);
  });

  it("excludes worktree when it is root (\/)", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/",
    } as ToolContext;

    const roots = buildAllowedRoots(context);
    expect(roots).toContain("/home/user/project");
    expect(roots).not.toContain("/");
    expect(roots).toHaveLength(1);
  });

  it("excludes worktree when it is undefined", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: undefined,
    } as ToolContext;

    const roots = buildAllowedRoots(context);
    expect(roots).toContain("/home/user/project");
    expect(roots).toHaveLength(1);
  });

  it("handles absolute paths with different formats", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/home/user/worktrees/feature",
    } as ToolContext;

    const roots = buildAllowedRoots(context);
    expect(roots).toEqual([
      "/home/user/project",
      "/home/user/worktrees/feature",
    ]);
  });
});

describe("integration: resolveWorkdir + isWithinBoundary + buildAllowedRoots", () => {
  it("validates resolved path against boundary", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/home/user/project/.worktrees/task-012",
    } as ToolContext;

    const allowedRoots = buildAllowedRoots(context);

    // Path inside context.directory
    const dirPath = path.resolve(context.directory, "./src/components");
    expect(isWithinBoundary(dirPath, allowedRoots)).toBe(true);

    // Path inside worktree
    const worktreePath = path.resolve(context.worktree!, "./build");
    expect(isWithinBoundary(worktreePath, allowedRoots)).toBe(true);

    // Path outside both
    const outsidePath = "/var/log";
    expect(isWithinBoundary(outsidePath, allowedRoots)).toBe(false);
  });

  it("rejects paths traversing outside boundary", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/",
    } as ToolContext;

    const allowedRoots = buildAllowedRoots(context);

    // Path that resolves to outside via parent traversal
    const outsidePath = path.resolve(context.directory, "../other-project");
    expect(isWithinBoundary(outsidePath, allowedRoots)).toBe(false);
  });

  it("accepts exact boundary roots", () => {
    const context: ToolContext = {
      directory: "/home/user/project",
      worktree: "/home/user/project/.worktrees/task-012",
    } as ToolContext;

    const allowedRoots = buildAllowedRoots(context);

    // Exact context.directory
    expect(isWithinBoundary(context.directory, allowedRoots)).toBe(true);

    // Exact worktree
    expect(isWithinBoundary(context.worktree!, allowedRoots)).toBe(true);
  });
});
