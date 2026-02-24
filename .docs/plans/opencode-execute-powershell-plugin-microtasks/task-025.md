# Task ID: task-025
# Task Name: Add local plugin-directory loading verification

## Context
This task is required to prove the plugin loads from local plugin directories in addition to npm package loading.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` plugin loading sources

## Output / Definition of Done
* `test/plugin.loading.local.test.ts` is added.
* The test creates a local plugin fixture in `.opencode/plugins/` format.
* The test verifies loader output includes `ExecutePowerShellPlugin` from local-file discovery.
* The test verifies tool hook registration from the discovered local plugin.
* Automated test proves local plugin-directory loading behavior.

## Step-by-Step Instructions
1. Add fixture setup in `test/plugin.loading.local.test.ts` that mirrors project plugin-directory layout.
2. Invoke plugin loading path used by OpenCode configuration loading for local plugin files.
3. Assert the loaded hooks include the `execute_powershell` tool registration.
4. Ensure the test fails before loader compatibility logic and passes after compatibility logic is in place.

## Verification
* Command: `bun test test/plugin.loading.local.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/plugin.loading.local.test.ts`.
