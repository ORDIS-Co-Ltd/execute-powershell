# Task ID: task-024
# Task Name: Implement CI workflow gates on Windows

## Context
This task is required to enforce automated validation on every push and pull request with Windows compatibility and full coverage gates.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Compatibility, Non-Functional Requirements
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` GitHub Actions version baseline

## Output / Definition of Done
* `.github/workflows/ci.yml` triggers on push and pull_request events.
* Workflow matrix includes `windows-latest` runner.
* Workflow uses `actions/checkout@v6` and `oven-sh/setup-bun@v2`.
* Workflow runs `bun install`, `bun test --coverage`, `bun run build`, and `bun run package:check`.
* `test/ci.workflow.test.ts` validates workflow runner and required steps.

## Step-by-Step Instructions
1. Create `.github/workflows/ci.yml` with required events and runner matrix.
2. Add checkout and setup-bun actions with version pins defined by `tech_research.md`.
3. Add required build, test, and package validation commands as workflow steps.
4. Add `test/ci.workflow.test.ts` that parses workflow YAML and asserts required jobs and commands.
5. Ensure test fails before workflow file exists and passes after workflow file exists.

## Verification
* Command: `bun test test/ci.workflow.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/ci.workflow.test.ts`.
