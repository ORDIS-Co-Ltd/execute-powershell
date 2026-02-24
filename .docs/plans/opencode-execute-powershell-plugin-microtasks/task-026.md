# Task ID: task-026
# Task Name: Add tool discovery and session invokability verification

## Context
This task is required to prove the registered tool is discoverable in runtime tool inventory and invokable during a session flow.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Registration
* `.docs/requirements/opencode-execute-powershell-plugin.md` Technology Baseline line on `ToolRegistry.fromPlugin()`
* `src/index.ts`

## Output / Definition of Done
* `test/execute_powershell.discovery.test.ts` is added.
* The test constructs runtime tool inventory from plugin hooks.
* The test asserts inventory includes `execute_powershell` with expected description and argument schema keys.
* The test invokes the tool through registry execution path and asserts string output contract type.
* Automated test proves discoverability and invokability requirements.

## Step-by-Step Instructions
1. Add `test/execute_powershell.discovery.test.ts` using runtime registry construction path.
2. Register `ExecutePowerShellPlugin` in test setup and collect resulting tool registry entries.
3. Assert `execute_powershell` presence in registry list and assert callable execution path.
4. Ensure the test fails before registration compatibility and passes after compatibility is complete.

## Verification
* Command: `bun test test/execute_powershell.discovery.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.discovery.test.ts`.
