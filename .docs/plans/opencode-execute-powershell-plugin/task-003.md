# Task ID: task-003
# Task Name: Implement Tool Argument Schema And Defaults

## Context
This task is required to implement the tool argument contract and validation rules using Zod.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Tool Arguments
* Zod docs (Context7 `/colinhacks/zod`)

## Output / Definition of Done
* `src/tools/execute_powershell.ts` defines a Zod raw shape with:
  * `command` required string
  * `description` required string
  * `timeout_ms` number with integer and minimum constraints and a default of `120000`
  * `workdir` string accepted and treated as an omitted-by-default value at schema level
* `test/execute_powershell.schema.test.ts` covers:
  * defaulting of `timeout_ms`
  * rejection of non-integer `timeout_ms`
  * rejection of negative `timeout_ms`
  * acceptance of `timeout_ms === 0`

## Step-by-Step Instructions
1. Implement a schema raw-shape object using `tool.schema` from `@opencode-ai/plugin`.
2. Ensure `timeout_ms` is parsed as an integer and defaults to `120000` when omitted.
3. Ensure `timeout_ms` rejects negative values.
4. Ensure the execute function applies the runtime default `workdir = context.directory` when omitted.
5. Add schema-only unit tests by calling the tool’s underlying zod object parser.

## Verification
* `bun test --coverage`
