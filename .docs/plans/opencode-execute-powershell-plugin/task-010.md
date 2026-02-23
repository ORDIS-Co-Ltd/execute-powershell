# Task ID: task-010
# Task Name: Add Windows Integration Tests For pwsh And powershell.exe

## Context
This task is required to validate real PowerShell execution semantics on Windows, including stdin-driven program text and non-interactive execution.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Compatibility
  * Tool Execution Semantics
* Microsoft Learn PowerShell CLI docs for stdin execution

## Output / Definition of Done
* `test/execute_powershell.integration.windows.test.ts` is added and runs only on Windows.
* The integration test executes:
  * a command that writes to stdout
  * a command that writes to stderr
  * a command that exits with a non-zero code
* The integration test asserts:
  * tool output contains combined output
  * metadata footer contains correct `exitCode`
  * tool fails with clear error when PowerShell is unavailable (test via PATH manipulation)

## Step-by-Step Instructions
1. Implement Windows-only test gating using `process.platform === "win32"`.
2. Implement a test that invokes the tool with `command` containing PowerShell code that:
   1. writes one line to stdout
   2. writes one line to stderr
3. Assert combined output contains both lines.
4. Implement a test that executes `exit 5` and asserts `exitCode` equals `5`.
5. Implement a test that simulates missing executables by injecting a resolver override and asserts the error message.

## Verification
* `bun test --coverage`
