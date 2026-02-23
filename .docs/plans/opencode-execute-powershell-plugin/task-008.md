# Task ID: task-008
# Task Name: Implement Output Capture And Metadata Footer

## Context
This task is required to implement the tool output contract: combined stdout/stderr in execution order, UTF-8 decoding, and a machine-readable metadata footer.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Output Contract
* Bun ReadableStream utilities (Context7 `/oven-sh/bun`)

## Output / Definition of Done
* `src/tools/output.ts` exports `collectCombinedOutput(proc): Promise<string>` that returns combined output.
* The collector is required to preserve execution ordering of interleaved stdout/stderr chunks.
* `src/tools/metadata.ts` exports `formatMetadataFooter(meta): string` and `parseMetadataFooter(text): meta`.
* `src/tools/execute_powershell.ts` appends `<powershell_metadata>{...}</powershell_metadata>` to returned output.
* `test/execute_powershell.output.test.ts` covers:
  * interleaving ordering using synthetic ReadableStreams
  * UTF-8 decoding behavior
  * footer JSON parse and required keys

## Step-by-Step Instructions
1. Implement a stream multiplexer that reads from `proc.stdout` and `proc.stderr` concurrently and appends decoded chunks into a single buffer in arrival order.
2. Use `TextDecoder("utf-8")` with streaming decode per stream.
3. Implement footer formatting with JSON and required tags.
4. Ensure the footer contains `exitCode` and ended-by state fields.
5. Add unit tests with synthetic streams that emit alternating bytes to stdout and stderr.

## Verification
* `bun test --coverage`
