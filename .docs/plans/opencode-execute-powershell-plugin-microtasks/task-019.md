# Task ID: task-019
# Task Name: Implement timeout and abort coordination

## Context
This task is required to coordinate timeout and abort signals and expose deterministic `endedBy` state.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Cancellation And Timeouts
* `src/tools/process.ts`
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* `src/tools/process.ts` exports `createTerminationSignal(contextAbort, timeoutMs)`.
* Coordinator disables timer behavior when `timeoutMs` equals `0`.
* Coordinator reports `endedBy` state as `exit`, `timeout`, or `abort`.
* `test/execute_powershell.timeout.abort.test.ts` validates timeout and abort paths.
* Automated test proves signal orchestration behavior.

## Step-by-Step Instructions
1. Implement `createTerminationSignal()` with one merged `AbortSignal` and ended-state tracker.
2. Register `context.abort` listener and timeout timer logic.
3. Wire `createTerminationSignal()` into execute flow and metadata state handling.
4. Add `test/execute_powershell.timeout.abort.test.ts` with fake timers and abort controller fixtures.
5. Ensure test fails before coordinator implementation and passes after coordinator implementation.

## Verification
* Command: `bun test test/execute_powershell.timeout.abort.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.timeout.abort.test.ts`.
