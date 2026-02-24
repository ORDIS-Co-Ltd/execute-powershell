import path from "path";
import type { ToolContext } from "@opencode-ai/plugin/tool";

/**
 * Resolves a workdir argument to an absolute path.
 *
 * Rules:
 * 1. If workdirArg is omitted, uses '.' semantics (resolves to contextDirectory)
 * 2. If workdirArg is absolute, returns it normalized
 * 3. If workdirArg is relative, resolves it against contextDirectory
 *
 * @param contextDirectory - The base directory from context
 * @param workdirArg - Optional workdir argument (can be relative, absolute, or omitted)
 * @returns The absolute, normalized path
 */
export function resolveWorkdir(
  contextDirectory: string,
  workdirArg?: string
): string {
  const rawWorkdir = workdirArg ?? ".";
  if (path.isAbsolute(rawWorkdir)) {
    return path.normalize(rawWorkdir);
  }
  return path.resolve(contextDirectory, rawWorkdir);
}

/**
 * Checks if a resolved path is within the allowed boundary roots.
 *
 * A path is considered "within boundary" if:
 * - It exactly matches an allowed root
 * - It starts with an allowed root path + path separator
 * - The root is "/" (Unix root allows all paths)
 *
 * @param resolvedPath - The absolute, normalized path to check
 * @param allowedRoots - Array of allowed root paths (should be absolute and normalized)
 * @returns true if the path is within any of the allowed roots
 */
export function isWithinBoundary(
  resolvedPath: string,
  allowedRoots: string[]
): boolean {
  const normalizedPath = path.normalize(resolvedPath);
  return allowedRoots.some((root) => {
    const normalizedRoot = path.normalize(root);

    // Exact match
    if (normalizedPath === normalizedRoot) {
      return true;
    }

    // Root "/" allows everything on Unix
    if (normalizedRoot === "/") {
      return true;
    }

    // Ensure root has trailing separator for proper prefix check
    const rootWithSep = normalizedRoot.endsWith(path.sep)
      ? normalizedRoot
      : normalizedRoot + path.sep;

    return normalizedPath.startsWith(rootWithSep);
  });
}

/**
 * Builds the list of allowed boundary roots from the tool context.
 *
 * Rules:
 * 1. Always include context.directory
 * 2. Include context.worktree only if it's not "/"
 *
 * @param context - The tool context containing directory and worktree information
 * @returns Array of allowed root paths
 */
export function buildAllowedRoots(context: ToolContext): string[] {
  const roots = [context.directory];
  if (context.worktree && context.worktree !== "/") {
    roots.push(context.worktree);
  }
  return roots;
}
