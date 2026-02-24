# Task ID: task-017
# Task Name: Implement combined output collector

## Context
This task is required to collect `stdout` and `stderr` as one ordered text stream for tool return output.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Output Contract
* `src/tools/output.ts`

## Output / Definition of Done
* `src/tools/output.ts` exports `collectCombinedOutput(proc): Promise<string>`.
* Collector decodes bytes through `TextDecoder("utf-8")`.
* Collector reads `stdout` and `stderr` concurrently and appends text in observed arrival order.
* `test/execute_powershell.output.collector.test.ts` validates interleaving and UTF-8 behavior.
* Automated test proves output collector contract.

## Step-by-Step Instructions
1. Implement stream reader logic for both process streams.
2. Add arrival-order append logic that preserves observed chunk sequence.
3. Decode output with UTF-8 streaming decode.
4. Add `test/execute_powershell.output.collector.test.ts` with synthetic stream fixtures.
5. Ensure test fails before collector implementation and passes after collector implementation.

## Verification
* Command: `bun test test/execute_powershell.output.collector.test.ts`
* Expected result: command exits with status `0` and the test runner reports a passing suite for `test/execute_powershell.output.collector.test.ts`.
