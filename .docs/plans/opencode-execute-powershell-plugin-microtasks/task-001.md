# Task ID: task-001
# Task Name: Define package manifest baseline

## Context
This task is required to define package identity, dependency pins, and script entrypoints that all implementation tasks will consume.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading, Technology Baseline
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` version baseline

## Output / Definition of Done
* `package.json` is created with `name`, `version`, `type`, and `packageManager` fields.
* `package.json` pins `@opencode-ai/plugin@1.2.10` and `zod@4.3.6`.
* `package.json` pins `typescript@5.9.3` and `@types/bun@1.3.9` in `devDependencies`.
* `package.json` defines `test`, `build`, and `package:check` scripts.
* `test/package.manifest.test.ts` is added to assert manifest invariants.

## Step-by-Step Instructions
1. Create `package.json` with ESM package settings and pinned dependency versions from `tech_research.md`.
2. Add scripts that map to implementation verification commands.
3. Add `test/package.manifest.test.ts` that reads `package.json` and asserts required fields and versions.
4. Ensure the test fails before manifest fields exist and passes after manifest fields are present.

## Verification
* Command: `bun test test/package.manifest.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/package.manifest.test.ts`.
