# Task ID: task-007
# Task Name: Implement timeout argument schema rules

## Context
This task is required to enforce timeout argument validation exactly as defined in the SRS.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Arguments
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` Zod API notes

## Output / Definition of Done
* `src/tools/execute_powershell.ts` args schema includes required `command` and `description` strings.
* `src/tools/execute_powershell.ts` args schema includes `timeout_ms` with `.int().min(0).default(120000)`.
* `test/execute_powershell.schema.timeout.test.ts` validates default, reject negative, reject non-integer, and accept zero.
* Runtime execution path consumes parsed timeout value from schema output.
* Automated test proves timeout schema behavior.

## Step-by-Step Instructions
1. Update tool args schema to include `command`, `description`, and constrained `timeout_ms`.
2. Ensure schema default value sets `timeout_ms` to `120000` when omitted.
3. Add `test/execute_powershell.schema.timeout.test.ts` with parse assertions for boundary cases.
4. Ensure test fails before schema constraints exist and passes after constraints exist.

## Verification
* Command: `bun test test/execute_powershell.schema.timeout.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.schema.timeout.test.ts`.
