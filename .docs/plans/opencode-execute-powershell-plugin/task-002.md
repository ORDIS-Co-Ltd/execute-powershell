# Task ID: task-002
# Task Name: Implement Plugin Entrypoint And Tool Registration

## Context
This task is required to implement the OpenCode plugin function and register the `execute_powershell` tool through the plugin `tool` hook.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Functional Requirements: Plugin Loading, Tool Registration
* `@opencode-ai/plugin@1.2.10` types (`dist/index.d.ts`, `dist/tool.d.ts`)

## Output / Definition of Done
* `src/index.ts` exports `ExecutePowerShellPlugin` as a named export.
* `ExecutePowerShellPlugin` returns a hooks object that includes `tool.execute_powershell`.
* `src/tools/execute_powershell.ts` exports a ToolDefinition named `execute_powershell`.
* `test/execute_powershell.registration.test.ts` asserts:
  * the plugin export exists
  * the tool name equals `execute_powershell`
  * the tool is invokable as a function returning a string

## Step-by-Step Instructions
1. Implement `src/tools/execute_powershell.ts` as a ToolDefinition using `tool({ description, args, execute })`.
2. Implement `src/index.ts` to export `ExecutePowerShellPlugin` typed as `Plugin` and return `{ tool: { execute_powershell } }`.
3. Add `test/execute_powershell.registration.test.ts` that imports `ExecutePowerShellPlugin`, calls it with a minimal mock `PluginInput`, and asserts that `tool.execute_powershell` is defined.
4. Ensure the plugin function has no side effects at import time.

## Verification
* `bun test --coverage`
