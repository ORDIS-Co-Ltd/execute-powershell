# Task ID: task-010
# Task Name: Wire execute permission request flow

## Context
This task is required to enforce `execute_powershell` permission checks before subprocess creation.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Permission Enforcement
* `src/tools/permissions.ts`
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* `src/tools/permissions.ts` exports `askExecutePowerShellPermission(...)`.
* Permission request payload uses `permission: "execute_powershell"`, `patterns: [command]`, and `always` from `deriveAlwaysPattern()`.
* `src/tools/execute_powershell.ts` calls `askExecutePowerShellPermission(...)` before spawn logic.
* `test/execute_powershell.permission.ask.test.ts` validates payload fields and call ordering.
* Automated test proves permission gate behavior.

## Step-by-Step Instructions
1. Implement `askExecutePowerShellPermission()` with required `context.ask()` fields and metadata.
2. Wire execute handler to invoke the permission helper before any spawn-related function.
3. Add `test/execute_powershell.permission.ask.test.ts` with mocks for `context.ask()` and spawn wrappers.
4. Assert call sequence where permission ask occurs before subprocess creation.
5. Ensure test fails before permission wiring and passes after wiring.

## Verification
* Command: `bun test test/execute_powershell.permission.ask.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.permission.ask.test.ts`.
