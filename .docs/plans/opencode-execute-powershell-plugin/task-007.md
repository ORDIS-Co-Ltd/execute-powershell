# Task ID: task-007
# Task Name: Implement Non-Interactive Spawn With Stdin-Only Script Transport

## Context
This task is required to execute PowerShell using Bun process APIs, enforce non-interactive flags, and pass PowerShell program text via stdin.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Tool Execution Semantics
  * Security
* Microsoft Learn PowerShell CLI docs for `-Command -` stdin execution
* Bun spawn docs (Context7 `/oven-sh/bun`)

## Output / Definition of Done
* `src/tools/process.ts` exports `spawnPowerShell(options): Subprocess` where options include:
  * resolved executable kind/path
  * resolved workdir
  * abort signal
  * PowerShell program text
* Spawn argv is required to include:
  * `-NoProfile`
  * `-NonInteractive`
  * `-Command` and `-`
* Spawn argv is required to exclude user-supplied PowerShell program text.
* `test/execute_powershell.spawn.unit.test.ts` asserts that:
  * the spawned cmd array never contains the `command` string
  * spawn is configured with `stdin` carrying the PowerShell program text

## Step-by-Step Instructions
1. Implement `spawnPowerShell()` using `Bun.spawn({ cmd, cwd, stdin, stdout: "pipe", stderr: "pipe", signal, windowsHide: true })`.
2. Construct `cmd` as `[exePath, "-NoProfile", "-NonInteractive", "-Command", "-"]`.
3. Provide stdin as a UTF-8 payload using a `Blob` or `ReadableStream`.
4. Add a unit test that injects a spawn wrapper to capture the `cmd` array and asserts invariants.

## Verification
* `bun test --coverage`
