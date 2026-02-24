# Task ID: task-014
# Task Name: Implement PowerShell executable resolver

## Context
This task is required to select a PowerShell executable deterministically and fail with actionable messaging when unavailable.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Execution Semantics
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` Bun runtime notes

## Output / Definition of Done
* `src/tools/powershell_exe.ts` exports `resolvePowerShellExecutable()`.
* Resolver checks `Bun.which("pwsh")` before `Bun.which("powershell.exe")`.
* Resolver returns `{ kind, path }` for the selected executable.
* Resolver throws clear error text that contains both executable names when neither exists.
* `test/execute_powershell.executable.resolve.test.ts` validates precedence and error path.

## Step-by-Step Instructions
1. Implement `resolvePowerShellExecutable()` in `src/tools/powershell_exe.ts`.
2. Add deterministic precedence logic with explicit branch coverage.
3. Add `test/execute_powershell.executable.resolve.test.ts` with stubs for `Bun.which()`.
4. Ensure test fails before resolver implementation and passes after resolver implementation.

## Verification
* Command: `bun test test/execute_powershell.executable.resolve.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.executable.resolve.test.ts`.
