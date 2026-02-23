# Task ID: task-005
# Task Name: Implement Workdir Resolution And external_directory Permission

## Context
This task is required to normalize and resolve `workdir`, evaluate it against OpenCode boundary roots, and request `external_directory` permission when required.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Tool Arguments: `workdir`
  * Project Boundary Rules
  * Permission Enforcement: `external_directory`
* OpenCode reference implementation for `external_directory` patterns (OpenCode `assertExternalDirectory`)

## Output / Definition of Done
* `src/tools/workdir.ts` exports:
  * `resolveWorkdir(contextDirectory: string, workdirArg: string | undefined): string`
  * `isWithinBoundary(resolvedPath: string, allowedRoots: string[]): boolean`
  * `askExternalDirectoryIfRequired(context, resolvedWorkdir): Promise<void>`
* `askExternalDirectoryIfRequired()` calls `context.ask()` with:
  * `permission: "external_directory"`
  * `patterns` and `always` containing directory-glob patterns derived from resolved workdir
  * path separators normalized to `/`
* `test/execute_powershell.workdir.test.ts` covers:
  * default workdir resolution to `context.directory`
  * relative workdir resolution
  * boundary evaluation with `context.worktree === "/"`
  * boundary evaluation with `context.worktree !== "/"`
  * external_directory permission request patterns in `/` separator form

## Step-by-Step Instructions
1. Implement `resolveWorkdir()` using `path.resolve(contextDirectory, workdirArg ?? ".")` and ensure the returned path is absolute.
2. Implement `isWithinBoundary()` that returns true when the resolved workdir is contained within `context.directory` or within `context.worktree` when `context.worktree !== "/"`.
3. Implement `askExternalDirectoryIfRequired()`:
   1. Compute `glob = path.join(resolvedWorkdir, "*").replaceAll("\\", "/")`.
   2. Call `context.ask({ permission: "external_directory", patterns: [glob], always: [glob], metadata: { filepath: resolvedWorkdir, parentDir: resolvedWorkdir } })`.
4. Update `execute_powershell` to call `askExternalDirectoryIfRequired()` before spawn.
5. Add unit tests for both inside-boundary and outside-boundary paths.

## Verification
* `bun test --coverage`
