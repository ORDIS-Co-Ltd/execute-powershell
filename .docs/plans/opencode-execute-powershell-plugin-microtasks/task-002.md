# Task ID: task-002
# Task Name: Define TypeScript build configuration

## Context
This task is required to establish deterministic TypeScript build output for ESM runtime consumption and declaration publishing.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading, Technology Baseline
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` TypeScript API notes

## Output / Definition of Done
* `tsconfig.json` is created with ESM module output settings.
* `tsconfig.json` emits declarations into build output.
* `tsconfig.json` writes compiled files into `dist/`.
* `test/tsconfig.build.test.ts` is added to assert compiler options.
* Automated test coverage includes the configuration contract for this task.

## Step-by-Step Instructions
1. Create `tsconfig.json` with compiler options for ESM output and declaration emission.
2. Set output directories that align with package export paths.
3. Add `test/tsconfig.build.test.ts` that reads `tsconfig.json` and asserts required compiler settings.
4. Ensure the test fails before required compiler fields are present and passes after fields are present.

## Verification
* Command: `bun test test/tsconfig.build.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/tsconfig.build.test.ts`.
