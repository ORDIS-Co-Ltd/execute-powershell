# Task ID: task-011
# Task Name: Implement absolute workdir resolution

## Context
This task is required to normalize and resolve runtime work directories prior to any boundary enforcement.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Project Boundary Rules
* `src/tools/workdir.ts`

## Output / Definition of Done
* `src/tools/workdir.ts` exports `resolveWorkdir(contextDirectory, workdirArg): string`.
* Resolver returns an absolute path for omitted, relative, and absolute inputs.
* Resolver uses `context.directory` as the base directory.
* `test/execute_powershell.workdir.resolve.test.ts` validates all path forms.
* Automated test proves deterministic resolution.

## Step-by-Step Instructions
1. Create `src/tools/workdir.ts` and implement `resolveWorkdir()` with absolute output.
2. Use default `.` semantics for omitted `workdirArg`.
3. Add `test/execute_powershell.workdir.resolve.test.ts` with relative, absolute, and omitted cases.
4. Ensure test fails before resolver implementation and passes after resolver implementation.

## Verification
* Command: `bun test test/execute_powershell.workdir.resolve.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.workdir.resolve.test.ts`.
