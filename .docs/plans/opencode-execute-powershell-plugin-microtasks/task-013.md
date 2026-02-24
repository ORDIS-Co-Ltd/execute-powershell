# Task ID: task-013
# Task Name: Wire external_directory permission request flow

## Context
This task is required to enforce `external_directory` permission for out-of-boundary work directories.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Permission Enforcement, Project Boundary Rules
* `src/tools/workdir.ts`
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* `src/tools/workdir.ts` exports `askExternalDirectoryIfRequired(...)`.
* Permission ask payload uses `permission: "external_directory"` with normalized `/` separator glob patterns.
* `src/tools/execute_powershell.ts` invokes external directory gating before process spawn.
* `test/execute_powershell.workdir.permission.test.ts` validates inside-boundary skip and outside-boundary ask.
* Automated test proves external directory gate behavior.

## Step-by-Step Instructions
1. Implement `askExternalDirectoryIfRequired()` using resolved workdir and boundary result.
2. Build glob pattern from resolved workdir and normalize separators to `/`.
3. Wire helper invocation into execute flow before process creation.
4. Add `test/execute_powershell.workdir.permission.test.ts` with ask/no-ask assertions.
5. Ensure test fails before helper wiring and passes after helper wiring.

## Verification
* Command: `bun test test/execute_powershell.workdir.permission.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.workdir.permission.test.ts`.
