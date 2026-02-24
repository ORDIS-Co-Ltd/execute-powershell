export function buildPowerShellCommand(exePath: string): string[] {
  return [exePath, "-NoProfile", "-NonInteractive", "-Command", "-"];
}
