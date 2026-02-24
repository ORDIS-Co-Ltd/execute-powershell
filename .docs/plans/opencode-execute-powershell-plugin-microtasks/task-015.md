# Task ID: task-015
# Task Name: Implement spawn command argv invariants

## Context
This task is required to lock down process argv so user script text never appears in OS command-line arguments.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Execution Semantics, Security
* `src/tools/process.ts`

## Output / Definition of Done
* `src/tools/process.ts` exports `buildPowerShellCommand(exePath: string): string[]`.
* Command array equals `[exePath, "-NoProfile", "-NonInteractive", "-Command", "-"]`.
* Command builder API accepts no user-supplied PowerShell script text.
* `test/execute_powershell.process.argv.test.ts` validates exact argv sequence.
* Automated test proves command-line injection prevention for tool script payload.

## Step-by-Step Instructions
1. Add `buildPowerShellCommand()` in `src/tools/process.ts`.
2. Return constant argument sequence required by the SRS.
3. Add `test/execute_powershell.process.argv.test.ts` with equality assertions over resulting argv.
4. Ensure test fails before builder implementation and passes after builder implementation.

## Verification
* Command: `bun test test/execute_powershell.process.argv.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.process.argv.test.ts`.
