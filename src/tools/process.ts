/**
 * Build PowerShell command argv array with security invariants.
 *
 * SECURITY: This function must NEVER accept or include user-supplied script text
 * in the returned argv array. Script text must be passed via stdin to prevent
 * command-line injection attacks.
 *
 * @param exePath - Path to the PowerShell executable
 * @returns Array of command-line arguments for spawning PowerShell
 */
export function buildPowerShellCommand(exePath: string): string[] {
  return [exePath, "-NoProfile", "-NonInteractive", "-Command", "-"];
}

/**
 * Termination signal interface for coordinating timeout and abort.
 */
export interface TerminationSignal {
  /** AbortSignal that is triggered on timeout or abort */
  signal: AbortSignal;
  /** Returns how the execution ended: "exit", "timeout", or "abort" */
  getEndedBy: () => "exit" | "timeout" | "abort";
}

/**
 * Creates a termination signal coordinator that merges context abort and timeout.
 *
 * This function creates an AbortController and wires up:
 * - Context abort listener: triggers abort when the parent context is cancelled
 * - Timeout logic: triggers abort after timeoutMs milliseconds (disabled if 0)
 *
 * The `getEndedBy()` function reports how the execution ended:
 * - "exit": Process completed normally (signal not triggered by timeout/abort)
 * - "timeout": Timeout duration was exceeded
 * - "abort": Explicitly cancelled via context.abort
 *
 * @param contextAbort - Optional AbortSignal from parent context
 * @param timeoutMs - Timeout in milliseconds (0 disables timeout)
 * @returns TerminationSignal with signal and endedBy tracker
 */
export function createTerminationSignal(
  contextAbort: AbortSignal | undefined,
  timeoutMs: number
): TerminationSignal {
  // Check if already aborted - if so, return immediately with abort status
  if (contextAbort?.aborted) {
    return {
      signal: contextAbort,
      getEndedBy: () => "abort",
    };
  }

  const controller = new AbortController();
  let endedBy: "exit" | "timeout" | "abort" = "exit";

  // Handle context abort - triggered immediately when parent context cancels
  if (contextAbort) {
    contextAbort.addEventListener("abort", () => {
      // Only set if not already decided (first-cause wins)
      if (endedBy === "exit") {
        endedBy = "abort";
        controller.abort();
      }
    });
  }

  // Handle timeout - only set up if timeoutMs > 0
  let timeoutId: Timer | undefined;
  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      // Only set if not already decided (first-cause wins)
      if (endedBy === "exit") {
        endedBy = "timeout";
        controller.abort();
      }
    }, timeoutMs);
  }

  // Clean up timeout when signal is aborted (prevents memory leaks)
  controller.signal.addEventListener("abort", () => {
    if (timeoutId) clearTimeout(timeoutId);
  });

  return {
    signal: controller.signal,
    getEndedBy: () => endedBy,
  };
}

/**
 * Options for spawning a PowerShell process with stdin transport.
 */
export interface SpawnPowerShellOptions {
  /** Path to the PowerShell executable */
  exePath: string;
  /** PowerShell script text (goes to stdin, NOT argv) */
  command: string;
  /** Working directory for the spawned process */
  cwd: string;
  /** Optional AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * Spawn a PowerShell process with script text passed via stdin.
 *
 * SECURITY: The command text is NEVER included in argv - it is always
 * passed via stdin to prevent command-line injection attacks.
 *
 * @param options - Spawn options including exePath, command, cwd, and signal
 * @returns Subprocess handle with piped stdout/stderr
 */
export function spawnPowerShell(options: SpawnPowerShellOptions) {
  const cmd = buildPowerShellCommand(options.exePath);
  const stdin = new TextEncoder().encode(options.command);

  return Bun.spawn({
    cmd,
    stdin,
    cwd: options.cwd,
    stdout: "pipe",
    stderr: "pipe",
    signal: options.signal,
    windowsHide: true,
  });
}
