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
