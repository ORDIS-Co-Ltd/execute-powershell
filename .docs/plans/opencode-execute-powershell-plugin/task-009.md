# Task ID: task-009
# Task Name: Implement Abort, Timeout, And Process Tree Termination

## Context
This task is required to terminate the PowerShell process tree on abort and on timeout, and to return metadata that indicates abort and timeout outcomes.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections:
  * Cancellation And Timeouts
* Bun AbortSignal spawn support (Context7 `/oven-sh/bun`)
* Windows `taskkill` docs

## Output / Definition of Done
* `src/tools/process.ts` implements termination helpers:
  * `terminateProcessTree(pid: number): Promise<void>`
  * `withTimeout(signal: AbortSignal, timeoutMs: number): { signal: AbortSignal; endedBy: Promise<"abort" | "timeout" | "exit"> }`
* Windows termination uses `taskkill /PID <pid> /T /F`.
* The tool returns output with footer that indicates `endedBy`.
* `test/execute_powershell.timeout_abort.test.ts` covers:
  * timeout path sets `endedBy: "timeout"`
  * abort path sets `endedBy: "abort"`
  * `terminateProcessTree()` invocation on both paths

## Step-by-Step Instructions
1. Implement a combined AbortSignal:
   1. Create an `AbortController`.
   2. Subscribe to `context.abort` and abort the controller.
   3. Start a timer for `timeout_ms` when `timeout_ms > 0` and abort the controller.
2. On abort or timeout, call `terminateProcessTree(proc.pid)`.
3. Implement Windows `terminateProcessTree()` using a `Bun.spawn()` call to `taskkill.exe`.
4. Ensure the tool’s execution waits for process exit and returns a single string output.
5. Add unit tests that stub `terminateProcessTree()` and assert call counts.

## Verification
* `bun test --coverage`
