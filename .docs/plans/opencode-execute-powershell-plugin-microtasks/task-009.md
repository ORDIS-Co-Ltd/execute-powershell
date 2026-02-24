# Task ID: task-009
# Task Name: Implement command prefix derivation utility

## Context
This task is required to produce the deterministic `always` permission pattern from command tokens.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Permission Enforcement
* `src/tools/permissions.ts`

## Output / Definition of Done
* `src/tools/permissions.ts` exports `deriveAlwaysPattern(command: string): string`.
* Prefix derivation skips leading `&` and `.` tokens.
* Prefix derivation returns exactly one pattern in `<prefix> *` format.
* `test/execute_powershell.permission.prefix.test.ts` validates token handling edge cases.
* Automated test proves deterministic prefix derivation.

## Step-by-Step Instructions
1. Create `src/tools/permissions.ts` and implement `deriveAlwaysPattern()`.
2. Tokenize by whitespace and skip leading `&` and `.` tokens.
3. Return `<prefix> *` from the first remaining token.
4. Add `test/execute_powershell.permission.prefix.test.ts` with positive and edge-path cases.
5. Ensure test fails before derivation logic and passes after derivation logic.

## Verification
* Command: `bun test test/execute_powershell.permission.prefix.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.permission.prefix.test.ts`.
