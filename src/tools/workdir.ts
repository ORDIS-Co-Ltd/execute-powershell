import path from "path";

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
