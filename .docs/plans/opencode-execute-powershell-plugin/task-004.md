# Task ID: task-004
# Task Name: Implement Permission Ask And Command Prefix Derivation

## Context
This task is required to enforce OpenCode permissions for `execute_powershell` and implement deterministic `always` patterns derived from the PowerShell command prefix rules.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Permission Enforcement
* `@opencode-ai/plugin@1.2.10` `ToolContext.ask()` signature
* OpenCode Permissions docs (`https://opencode.ai/docs/permissions/`)

## Output / Definition of Done
* `src/tools/permissions.ts` exports:
  * `deriveAlwaysPattern(command: string): string`
  * `askExecutePowerShellPermission(context, command, description, resolvedWorkdir, timeoutMs): Promise<void>`
* `src/tools/execute_powershell.ts` calls `context.ask()` with:
  * `permission: "execute_powershell"`
  * `patterns: [command]`
  * `always: ["<prefix> *"]` where `<prefix>` follows the SRS token rules
* `test/execute_powershell.permissions.test.ts` covers:
  * skipping leading `&` and `.` tokens
  * prefix extraction for simple commands
  * the `always` array length equals 1
  * `context.ask()` is called before subprocess creation

## Step-by-Step Instructions
1. Implement `deriveAlwaysPattern()`:
   1. Split `command` into tokens using whitespace.
   2. Skip leading tokens equal to `&` or `.`.
   3. Use the first remaining token as the prefix.
   4. Return `${prefix} *`.
2. Implement `askExecutePowerShellPermission()` that calls `context.ask()` with required fields and stable metadata.
3. Refactor `execute_powershell` execute logic to call `askExecutePowerShellPermission()` before spawning.
4. Add unit tests that provide a mock `context.ask()` and assert inputs.
5. Add a unit test that replaces the spawn function with a spy and asserts that ask happens before spawn.

## Verification
* `bun test --coverage`
