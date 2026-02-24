# Task ID: task-028
# Task Name: Add Windows 10 and Windows 11 compatibility workflow matrix

## Context
This task is required to enforce automated compatibility validation for both Windows 10 and Windows 11 as explicit CI execution targets.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Compatibility
* `.github/workflows/ci.yml`

## Output / Definition of Done
* `.github/workflows/ci.yml` includes explicit matrix targets for Windows 10 and Windows 11 runners.
* Windows matrix entries run integration tests, build, and package checks.
* `test/ci.windows.compatibility.test.ts` is added to assert workflow matrix contains both Windows targets.
* Workflow assertions verify both compatibility lanes execute `bun test --coverage`.
* Automated test proves workflow compatibility matrix configuration.

## Step-by-Step Instructions
1. Update `.github/workflows/ci.yml` to define separate Windows 10 and Windows 11 matrix entries.
2. Ensure both entries execute identical verification steps required by coverage and packaging gates.
3. Add `test/ci.windows.compatibility.test.ts` that parses workflow YAML and asserts target presence and required steps.
4. Ensure the test fails before matrix expansion and passes after matrix expansion.

## Verification
* Command: `bun test test/ci.windows.compatibility.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/ci.windows.compatibility.test.ts`.
