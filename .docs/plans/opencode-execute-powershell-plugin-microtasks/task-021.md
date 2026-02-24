# Task ID: task-021
# Task Name: Add Windows integration execution tests

## Context
This task is required to validate real Windows execution behavior for both PowerShell executables and metadata outcomes.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Compatibility, Tool Execution Semantics, Cancellation And Timeouts
* `test/execute_powershell.integration.windows.test.ts`

## Output / Definition of Done
* `test/execute_powershell.integration.windows.test.ts` executes only on `process.platform === "win32"`.
* Integration test validates combined stdout and stderr output for stdin-driven script execution.
* Integration test validates non-zero exit code propagation through metadata footer.
* Integration test validates missing executable error path through resolver override.
* Automated test suite reports pass on Windows and skip on non-Windows platforms.

## Step-by-Step Instructions
1. Create Windows-gated integration test suite in `test/execute_powershell.integration.windows.test.ts`.
2. Add stdin script case that writes to stdout and stderr.
3. Add non-zero exit case and assert footer `exitCode` value.
4. Add resolver override case and assert clear executable-not-found messaging.
5. Ensure tests fail before runtime implementation and pass after runtime implementation.

## Verification
* Command: `bun test test/execute_powershell.integration.windows.test.ts`
* Expected result: command exits with status `0`, with passing tests on Windows and a skipped suite on non-Windows hosts.
