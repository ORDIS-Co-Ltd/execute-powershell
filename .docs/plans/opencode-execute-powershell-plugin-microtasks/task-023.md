# Task ID: task-023
# Task Name: Implement npm pack dry-run artifact validation

## Context
This task is required to verify publish-time package contents and fail fast for missing runtime artifacts.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading, Non-Functional Requirements
* `package.json`

## Output / Definition of Done
* `scripts/package-check.ts` is added to parse `npm pack --dry-run --json` output.
* `package:check` script fails when required files are absent from dry-run payload.
* Required files list includes `dist/index.js`, `dist/index.d.ts`, `README.md`, `LICENSE`, and `package.json`.
* `test/package.check.test.ts` validates artifact checker behavior using fixture payloads.
* Automated test proves package artifact validation logic.

## Step-by-Step Instructions
1. Create `scripts/package-check.ts` with deterministic required-file assertions.
2. Add `LICENSE` file with project license text required for package publishing.
3. Add or update `package:check` script to execute `npm pack --dry-run --json` and validate output.
4. Add `test/package.check.test.ts` with passing and failing fixture cases.
5. Ensure test fails before checker implementation and passes after checker implementation.

## Verification
* Command: `bun test test/package.check.test.ts && bun run package:check`
* Expected result: both commands exit with status `0`, and the package check output confirms required files are present.
