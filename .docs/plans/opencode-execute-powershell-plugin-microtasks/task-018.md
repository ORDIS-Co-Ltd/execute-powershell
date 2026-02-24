# Task ID: task-018
# Task Name: Implement metadata footer assembly

## Context
This task is required to finalize the output contract by appending parseable metadata that captures execution outcome details.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Output Contract, Observability
* `src/tools/metadata.ts`
* `src/tools/execute_powershell.ts`

## Output / Definition of Done
* `src/tools/metadata.ts` exports `formatMetadataFooter(meta)`.
* `src/tools/metadata.ts` exports `parseMetadataFooter(text)`.
* `src/tools/execute_powershell.ts` appends one `<powershell_metadata>...</powershell_metadata>` footer per execution.
* Footer JSON includes `exitCode`, `endedBy`, `shell`, `resolvedWorkdir`, `timeoutMs`, and `durationMs`.
* `test/execute_powershell.metadata.footer.test.ts` validates format and parse behavior.

## Step-by-Step Instructions
1. Implement metadata footer serializer with stable JSON field names.
2. Implement metadata footer parser that extracts tagged payload and decodes JSON.
3. Wire execute return path to append footer after collected output.
4. Add `test/execute_powershell.metadata.footer.test.ts` for serialize and parse assertions.
5. Ensure test fails before metadata implementation and passes after metadata implementation.

## Verification
* Command: `bun test test/execute_powershell.metadata.footer.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.metadata.footer.test.ts`.
