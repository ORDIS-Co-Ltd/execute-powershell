# Task ID: task-008
# Task Name: Implement workdir argument default behavior

## Context
This task is required to support `workdir` input while enforcing default behavior to `context.directory` during execution.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Arguments
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* Tool args schema accepts `workdir` as a string input field.
* Runtime execution defaults `workdir` to `context.directory` when argument is omitted.
* Runtime execution preserves explicit `workdir` argument values.
* `test/execute_powershell.schema.workdir.test.ts` validates omitted and explicit paths.
* Automated test proves workdir default behavior.

## Step-by-Step Instructions
1. Extend tool args schema to include `workdir` string acceptance.
2. Update execute path to compute `effectiveWorkdir` with default `context.directory`.
3. Add `test/execute_powershell.schema.workdir.test.ts` to assert omitted and explicit behavior.
4. Ensure test fails before runtime default logic and passes after runtime default logic.

## Verification
* Command: `bun test test/execute_powershell.schema.workdir.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.schema.workdir.test.ts`.
