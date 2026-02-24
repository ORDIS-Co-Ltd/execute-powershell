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
