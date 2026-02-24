# Task ID: task-005
# Task Name: Implement plugin export contract

## Context
This task is required to define the plugin entrypoint signature that OpenCode plugin loading expects.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` OpenCode plugin API notes

## Output / Definition of Done
* `src/index.ts` exports `ExecutePowerShellPlugin` as a named export.
* `ExecutePowerShellPlugin` is typed as `Plugin` from `@opencode-ai/plugin`.
* Importing `src/index.ts` performs no side-effect execution.
* `test/execute_powershell.plugin-export.test.ts` validates export shape and function type.
* Automated test proves entrypoint contract correctness.

## Step-by-Step Instructions
1. Replace placeholder logic in `src/index.ts` with a named `ExecutePowerShellPlugin` export typed as `Plugin`.
2. Keep function body minimal while preserving async plugin signature.
3. Add `test/execute_powershell.plugin-export.test.ts` to assert named export existence and async callable behavior.
4. Ensure test fails before export contract implementation and passes after implementation.

## Verification
* Command: `bun test test/execute_powershell.plugin-export.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.plugin-export.test.ts`.
