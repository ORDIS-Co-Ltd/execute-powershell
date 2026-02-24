# Task ID: task-012
# Task Name: Implement boundary root evaluation

## Context
This task is required to classify resolved work directories as inside or outside the OpenCode boundary roots.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Project Boundary Rules
* `src/tools/workdir.ts`

## Output / Definition of Done
* `src/tools/workdir.ts` exports `isWithinBoundary(resolvedPath, allowedRoots): boolean`.
* Boundary logic always includes `context.directory` root.
* Boundary logic includes `context.worktree` root only when value is not `/`.
* `test/execute_powershell.workdir.boundary.test.ts` validates inside and outside cases.
* Automated test proves boundary classification behavior.

## Step-by-Step Instructions
1. Implement `isWithinBoundary()` using normalized absolute path comparisons.
2. Ensure root list construction includes `context.directory` and conditionally includes `context.worktree`.
3. Add `test/execute_powershell.workdir.boundary.test.ts` with path matrix cases.
4. Ensure test fails before boundary logic and passes after boundary logic.

## Verification
* Command: `bun test test/execute_powershell.workdir.boundary.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.workdir.boundary.test.ts`.
