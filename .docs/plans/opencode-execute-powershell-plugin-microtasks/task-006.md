# Task ID: task-006
# Task Name: Implement tool registration contract

## Context
This task is required to register the `execute_powershell` tool through the plugin `tool` hook.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Tool Registration
* `.docs/plans/opencode-execute-powershell-plugin-microtasks/tech_research.md` tool helper API notes

## Output / Definition of Done
* `src/tools/execute_powershell.ts` exports `execute_powershell` as a `ToolDefinition`.
* `src/index.ts` returns `{ tool: { execute_powershell } }` from `ExecutePowerShellPlugin`.
* Initial tool execute handler returns a string placeholder that test code will assert.
* `test/execute_powershell.registration.test.ts` validates registration and callable execution.
* Automated test proves tool registration behavior.

## Step-by-Step Instructions
1. Create `src/tools/execute_powershell.ts` with a `tool({ description, args, execute })` definition.
2. Import `execute_powershell` into `src/index.ts` and wire tool hook return value.
3. Add `test/execute_powershell.registration.test.ts` with plugin invocation and hook shape assertions.
4. Ensure test fails before registration wiring and passes after wiring.

## Verification
* Command: `bun test test/execute_powershell.registration.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.registration.test.ts`.
