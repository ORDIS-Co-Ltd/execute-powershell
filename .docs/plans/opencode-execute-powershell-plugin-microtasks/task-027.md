# Task ID: task-027
# Task Name: Add output truncation-boundary non-interference verification

## Context
This task is required to prove the plugin does not truncate output and leaves truncation responsibility to OpenCode tool-output boundaries.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Output Contract
* `src/tools/output.ts`
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* `test/execute_powershell.output.truncation.test.ts` is added.
* The test feeds output size above expected OpenCode truncation thresholds into plugin return path.
* The test asserts plugin return string preserves full generated output and metadata footer.
* The test asserts plugin code path performs no manual slicing, clipping, or byte-limit truncation.
* Automated test proves truncation-boundary non-interference.

## Step-by-Step Instructions
1. Add `test/execute_powershell.output.truncation.test.ts` with oversized synthetic output fixtures.
2. Execute plugin output assembly path and capture returned string.
3. Assert returned string contains full payload plus footer tags without truncation markers.
4. Ensure the test fails before non-truncation behavior and passes after non-truncation behavior is guaranteed.

## Verification
* Command: `bun test test/execute_powershell.output.truncation.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.output.truncation.test.ts`.
