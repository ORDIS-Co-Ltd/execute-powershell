# Review Report: task-020 (/ Implement process tree termination behavior)

## Status
**FAIL**
*(Note: Use PASS only if the code is perfect, secure, matches the plan, and tests pass.)*

## Compliance Check
- [ ] Implementation matches `task-[id].md` instructions.
- [ ] Definition of Done met.
- [x] No unauthorized architectural changes.

## Verification Output
*   **Command Run:** `bun test test/execute_powershell.termination.test.ts`
*   **Result:** Pass. Exit status `0`; suite reports `11 pass`, `0 fail`.
*   **Command Run:** `bun test`
*   **Result:** Pass. Exit status `0`; full suite reports `223 pass`, `0 fail`.

## Issues Found (If FAIL)
*   **Critical:** `src/tools/execute_powershell.ts` only calls `terminateProcessTree` in the success path (`try` block at `src/tools/execute_powershell.ts:69`), but timeout/abort outcomes can also land in the `catch` path (`src/tools/execute_powershell.ts:87`) where no termination call exists. This does not satisfy the requirement to invoke termination for both timeout and abort outcomes.
*   **Major:** `test/execute_powershell.termination.test.ts` validates `terminateProcessTree` payload construction, but it does not validate execute-flow invocation behavior for timeout and abort as required. Full-suite coverage confirms invocation lines are untested (`src/tools/execute_powershell.ts:70`, `src/tools/execute_powershell.ts:71`, `src/tools/execute_powershell.ts:72`).
*   **Minor:** None.

## Required Actions
1. Update `execute_powershell` so process-tree termination is invoked whenever `endedBy` is `"timeout"` or `"abort"` and `proc?.pid` exists, including error paths (e.g., shared helper or `finally`-style flow).
2. Add/extend tests to assert execute-flow termination invocation on both timeout and abort outcomes, not only standalone helper payload assertions.
3. Re-run `bun test test/execute_powershell.termination.test.ts` and keep it green after invocation-behavior coverage is added.
