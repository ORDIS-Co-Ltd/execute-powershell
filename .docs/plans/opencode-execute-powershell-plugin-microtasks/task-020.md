# Task ID: task-020
# Task Name: Implement process tree termination behavior

## Context
This task is required to terminate the launched PowerShell process tree for timeout and abort outcomes.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Cancellation And Timeouts
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` Windows `taskkill` notes
* `src/tools/process.ts`

## Output / Definition of Done
* `src/tools/process.ts` exports `terminateProcessTree(pid)`.
* Windows termination uses `taskkill /PID <pid> /T /F`.
* Execute flow calls `terminateProcessTree(pid)` for both timeout and abort paths.
* `test/execute_powershell.termination.test.ts` validates invocation behavior and Windows command payload.
* Automated test proves termination behavior.

## Step-by-Step Instructions
1. Implement `terminateProcessTree(pid)` with platform-branch logic.
2. Invoke `taskkill` with required arguments on Windows hosts.
3. Wire termination call into timeout and abort branches in execute logic.
4. Add `test/execute_powershell.termination.test.ts` with platform and spawn stubs.
5. Ensure test fails before termination wiring and passes after termination wiring.

## Verification
* Command: `bun test test/execute_powershell.termination.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.termination.test.ts`.
