# Task ID: task-029
# Task Name: Add execution-mode compliance verification for -Command stdin path

## Context
This task is required to enforce the execution-mode contract that uses stdin transport with `-Command -` and excludes encoded command transport.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Execution Semantics, Technology Baseline
* `src/tools/process.ts`

## Output / Definition of Done
* `test/execute_powershell.execution_mode.test.ts` is added.
* The test asserts argv includes `-Command` and `-` in required positions.
* The test asserts argv excludes `-EncodedCommand` for all execution paths.
* The test asserts user-supplied PowerShell script text is absent from command-line argv and present only in stdin payload.
* Automated test proves execution-mode compliance with SRS transport requirements.

## Step-by-Step Instructions
1. Add `test/execute_powershell.execution_mode.test.ts` with spawn-wrapper capture fixtures.
2. Assert required argv tokens for stdin command mode.
3. Assert prohibition of `-EncodedCommand` and command-text argv injection.
4. Ensure the test fails before execution-mode compliance and passes after compliance is implemented.

## Verification
* Command: `bun test test/execute_powershell.execution_mode.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.execution_mode.test.ts`.
