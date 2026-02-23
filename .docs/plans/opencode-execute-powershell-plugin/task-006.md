# Task ID: task-006
# Task Name: Implement PowerShell Executable Resolution

## Context
This task is required to deterministically select the PowerShell executable according to the required precedence and to fail with a clear error when PowerShell is unavailable.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Tool Execution Semantics: executable selection precedence
* Bun docs (Context7 `/oven-sh/bun`) for `Bun.which()`

## Output / Definition of Done
* `src/tools/powershell_exe.ts` exports `resolvePowerShellExecutable(): { kind: "pwsh" | "powershell.exe"; path: string }`.
* The resolver uses precedence:
  * `Bun.which("pwsh")`
  * `Bun.which("powershell.exe")`
* The resolver throws an error containing both executable names when neither is found.
* `test/execute_powershell.executable.test.ts` covers resolver precedence and error messaging via stubbing.

## Step-by-Step Instructions
1. Implement `resolvePowerShellExecutable()` and use `Bun.which()`.
2. Ensure the error message includes:
   * `pwsh` not found
   * `powershell.exe` not found
   * an actionable instruction that PowerShell is required
3. Add unit tests that stub `Bun.which()` to return deterministic values.

## Verification
* `bun test --coverage`
