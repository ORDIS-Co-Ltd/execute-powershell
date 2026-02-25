import path from "path";
import { statSync } from "node:fs";
import os from "node:os";
import type { ToolContext } from "@opencode-ai/plugin/tool";

const PATH_AWARE_COMMANDS = new Set([
  "cd",
  "chdir",
  "set-location",
  "sl",
  "push-location",
  "pushd",
  "remove-item",
  "ri",
  "rm",
  "del",
  "erase",
  "copy-item",
  "copy",
  "cp",
  "cpi",
  "move-item",
  "move",
  "mv",
  "mi",
  "new-item",
  "ni",
  "mkdir",
  "md",
  "get-content",
  "gc",
  "cat",
  "type",
  "set-content",
  "sc",
  "add-content",
  "ac",
  "out-file",
  "get-childitem",
  "gci",
  "ls",
  "dir",
]);

const PATH_VALUE_PARAMS = new Set([
  "path",
  "literalpath",
  "destination",
  "source",
  "filepath",
  "outfilepath",
]);

const NO_VALUE_SWITCHES = new Set([
  "recurse",
  "force",
  "name",
  "file",
  "directory",
]);

type ParameterExpectation = "none" | "path" | "skip";

/**
 * Asks for external_directory permission if the resolved workdir is outside the allowed boundary.
 *
 * Rules:
 * 1. Build allowed roots from context
 * 2. Check if resolvedWorkdir is within boundary
 * 3. If outside: call context.ask() with permission "external_directory" and glob pattern
 * 4. If inside: return without asking (no-op)
 *
 * @param context - The tool execution context
 * @param resolvedWorkdir - The absolute, normalized workdir path
 */
export async function askExternalDirectoryIfRequired(
  context: ToolContext,
  resolvedWorkdir: string
): Promise<void> {
  await askExternalDirectoriesIfRequired(context, [resolvedWorkdir]);
}

/**
 * Ask external_directory permission for one or more resolved directories/paths.
 *
 * All paths are normalized and deduplicated before permission check.
 * Only paths outside project/worktree boundary trigger a permission prompt.
 */
export async function askExternalDirectoriesIfRequired(
  context: ToolContext,
  resolvedPaths: string[]
): Promise<void> {
  const allowedRoots = buildAllowedRoots(context);
  const externalDirs = new Set<string>();

  for (const p of resolvedPaths) {
    const normalized = path.normalize(p);
    if (!isWithinBoundary(normalized, allowedRoots)) {
      externalDirs.add(normalized);
    }
  }

  if (externalDirs.size === 0) return;

  const globPatterns = Array.from(externalDirs).map(
    (dir) => dir.replace(/\\/g, "/") + "/**"
  );

  await context.ask({
    permission: "external_directory",
    patterns: globPatterns,
    always: globPatterns,
    metadata: {},
  });
}

/**
 * Extract path-like directory targets from PowerShell command text.
 *
 * This mirrors OpenCode's bash behavior: best-effort extraction for path-aware
 * commands so external_directory can be enforced for command arguments, not just workdir.
 */
export function extractPowerShellCommandDirectories(
  command: string,
  cwd: string
): string[] {
  const tokens = tokenizePowerShell(command);
  const segments = splitCommandSegments(tokens);
  const result = new Set<string>();

  for (const segment of segments) {
    const commandInfo = parseSegment(segment);
    if (!commandInfo) continue;

    const { commandName, args } = commandInfo;
    if (!PATH_AWARE_COMMANDS.has(commandName)) continue;

    let expectation: ParameterExpectation = "none";
    for (const arg of args) {
      const stripped = stripOuterQuotes(arg);
      if (!stripped) continue;

      if (expectation === "path") {
        const resolved = resolvePathLike(cwd, stripped);
        if (resolved) result.add(resolveDirectoryTarget(resolved));
        expectation = "none";
        continue;
      }

      if (expectation === "skip") {
        expectation = "none";
        continue;
      }

      if (stripped.startsWith("-")) {
        const inlinePath = parseInlinePathParameter(stripped);
        if (inlinePath) {
          const resolved = resolvePathLike(cwd, inlinePath);
          if (resolved) result.add(resolveDirectoryTarget(resolved));
          expectation = "none";
          continue;
        }

        const param = stripped.replace(/^-+/, "").toLowerCase();
        if (PATH_VALUE_PARAMS.has(param)) {
          expectation = "path";
        } else if (NO_VALUE_SWITCHES.has(param) || param.includes(":")) {
          expectation = "none";
        } else {
          expectation = "skip";
        }
        continue;
      }

      const resolved = resolvePathLike(cwd, stripped);
      if (resolved) result.add(resolveDirectoryTarget(resolved));
    }
  }

  return Array.from(result);
}

function tokenizePowerShell(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;

  for (let i = 0; i < command.length; i++) {
    const char = command[i];

    if (quote) {
      current += char;

      if (char === quote) {
        if (quote === "'" && command[i + 1] === "'") {
          current += command[++i];
          continue;
        }
        if (quote === '"' && command[i - 1] === "`") {
          continue;
        }
        quote = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      quote = char;
      current += char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    if (char === "|" || char === ";") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
      continue;
    }

    current += char;
  }

  if (current) tokens.push(current);
  return tokens;
}

function splitCommandSegments(tokens: string[]): string[][] {
  const segments: string[][] = [];
  let current: string[] = [];

  for (const token of tokens) {
    if (token === "|" || token === ";") {
      if (current.length > 0) segments.push(current);
      current = [];
      continue;
    }
    current.push(token);
  }

  if (current.length > 0) segments.push(current);
  return segments;
}

function parseSegment(segment: string[]): { commandName: string; args: string[] } | null {
  const working = [...segment];
  while (working.length > 0 && (working[0] === "&" || working[0] === ".")) {
    working.shift();
  }
  if (working.length === 0) return null;

  const commandName = stripOuterQuotes(working[0]).toLowerCase();
  if (!commandName) return null;

  return {
    commandName,
    args: working.slice(1),
  };
}

function stripOuterQuotes(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    if (trimmed.startsWith("\"") && trimmed.endsWith("\"")) {
      return trimmed.slice(1, -1);
    }
    if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

function parseInlinePathParameter(token: string): string | null {
  const normalized = token.replace(/^-+/, "");
  const separatorIndex = normalized.indexOf(":");
  if (separatorIndex <= 0) return null;

  const paramName = normalized.slice(0, separatorIndex).toLowerCase();
  const value = normalized.slice(separatorIndex + 1);
  if (!PATH_VALUE_PARAMS.has(paramName)) return null;

  const stripped = stripOuterQuotes(value);
  return stripped.length > 0 ? stripped : null;
}

function resolvePathLike(cwd: string, value: string): string | null {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return null;

  if (value === "~") {
    return os.homedir();
  }

  if (value.startsWith("~/") || value.startsWith("~\\")) {
    return path.resolve(os.homedir(), value.slice(2));
  }

  if (/^\$home$/i.test(value)) {
    return os.homedir();
  }

  if (/^\$home[\\/]/i.test(value)) {
    return path.resolve(os.homedir(), value.slice(6));
  }

  if (value.startsWith("$")) return null;

  // Skip PowerShell provider paths like HKLM:\, Env:\ etc.
  if (/^[A-Za-z]{2,}:[\\/]/.test(value)) return null;

  if (isAbsolutePathLike(value)) {
    return path.normalize(value);
  }

  return path.resolve(cwd, value);
}

function isAbsolutePathLike(value: string): boolean {
  return (
    path.isAbsolute(value) ||
    /^[A-Za-z]:[\\/]/.test(value) ||
    value.startsWith("\\\\")
  );
}

function resolveDirectoryTarget(resolvedPath: string): string {
  try {
    const stats = statSync(resolvedPath);
    if (stats.isDirectory()) return path.normalize(resolvedPath);
    return path.dirname(resolvedPath);
  } catch {
    // Fall back to heuristic for non-existent paths.
  }

  if (resolvedPath.endsWith(path.sep)) return path.normalize(resolvedPath);
  if (path.extname(path.basename(resolvedPath))) {
    return path.dirname(resolvedPath);
  }
  return path.normalize(resolvedPath);
}

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
