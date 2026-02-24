# Task ID: task-016
# Task Name: Implement spawn wrapper with stdin transport

## Context
This task is required to execute the PowerShell process with stdin script transport, resolved cwd, and abort signal integration.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Execution Semantics, Cancellation And Timeouts
* `src/tools/process.ts`

## Output / Definition of Done
* `src/tools/process.ts` exports `spawnPowerShell(options)`.
* Spawn wrapper passes `stdin` payload from `command` text and never appends command text to argv.
* Spawn wrapper sets `cwd`, `stdout: "pipe"`, `stderr: "pipe"`, `signal`, and `windowsHide: true`.
* `test/execute_powershell.process.spawn.test.ts` validates spawn option payloads with a stubbed spawn backend.
* Automated test proves stdin-only script transport behavior.

## Step-by-Step Instructions
1. Implement `spawnPowerShell()` with explicit options object fields.
2. Connect `buildPowerShellCommand()` output to `cmd` input.
3. Serialize command text to UTF-8 stdin payload.
4. Add `test/execute_powershell.process.spawn.test.ts` with stub capture assertions.
5. Ensure test fails before spawn wrapper implementation and passes after spawn wrapper implementation.

## Verification
* Command: `bun test test/execute_powershell.process.spawn.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.process.spawn.test.ts`.
