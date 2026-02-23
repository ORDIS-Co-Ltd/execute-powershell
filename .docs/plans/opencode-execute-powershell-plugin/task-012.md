# Task ID: task-012
# Task Name: Add CI Workflow With Coverage Gate And Windows Runner

## Context
This task is required to ensure every change is validated with automated tests and 100% coverage on Windows.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Compatibility
  * Non-Functional Requirements: Observability, Security
* Bun CI guidance for `bun test --coverage`

## Output / Definition of Done
* `.github/workflows/ci.yml` runs on pull requests and pushes.
* The workflow runs:
  * `bun install`
  * `bun test --coverage`
  * `bun run build`
  * `bun run package:check`
* The workflow matrix includes Windows.

## Step-by-Step Instructions
1. Create `.github/workflows/ci.yml` with a job matrix that includes `windows-latest`.
2. Ensure the workflow installs Bun `1.3.9`.
3. Ensure the workflow runs tests with coverage enabled.
4. Ensure the workflow fails on coverage below 1.0 via `bunfig.toml`.

## Verification
* `bun test --coverage`
