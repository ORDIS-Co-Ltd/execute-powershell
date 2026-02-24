# Task ID: task-004
# Task Name: Create source and test scaffolding baseline

## Context
This task is required to create initial repository structure so subsequent tasks implement plugin logic without setup churn.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading, Tool Registration
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/master_plan.md` target files list

## Output / Definition of Done
* `src/` and `src/tools/` directories exist.
* `test/` directory exists with baseline test organization.
* `src/index.ts` exists as a placeholder module export.
* `test/smoke.test.ts` is added and imports the placeholder module.
* Smoke test execution passes.

## Step-by-Step Instructions
1. Create `src/`, `src/tools/`, and `test/` directories.
2. Add `src/index.ts` placeholder export that keeps module imports valid.
3. Add `test/smoke.test.ts` with a minimal assertion over the placeholder export.
4. Ensure smoke test fails before placeholder export exists and passes after placeholder export exists.

## Verification
* Command: `bun test test/smoke.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/smoke.test.ts`.
