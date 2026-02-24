# Task ID: task-003
# Task Name: Define Bun coverage gate configuration

## Context
This task is required to enforce full automated coverage as a hard quality gate for every behavior implemented in this feature.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Non-Functional Requirements, Technology Baseline
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` Bun coverage notes

## Output / Definition of Done
* `bunfig.toml` is created with `[test]` configuration.
* `bunfig.toml` enables coverage collection.
* `bunfig.toml` sets `coverageThreshold = 1.0`.
* `test/bunfig.coverage.test.ts` is added to assert threshold configuration.
* Automated verification for coverage gate config is present.

## Step-by-Step Instructions
1. Create `bunfig.toml` with Bun test settings required by the plan.
2. Set coverage threshold to `1.0` to enforce full line and function coverage.
3. Add `test/bunfig.coverage.test.ts` that parses `bunfig.toml` and validates coverage fields.
4. Ensure the new test fails before threshold definition exists and passes after threshold definition exists.

## Verification
* Command: `bun test test/bunfig.coverage.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/bunfig.coverage.test.ts`.
