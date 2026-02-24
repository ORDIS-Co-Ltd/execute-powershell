export interface PowerShellExecutable {
  kind: "pwsh" | "powershell";
  path: string;
}

export function resolvePowerShellExecutable(): PowerShellExecutable {
  const pwshPath = Bun.which("pwsh");
  if (pwshPath) {
    return { kind: "pwsh", path: pwshPath };
  }
  
  const winPwshPath = Bun.which("powershell.exe");
  if (winPwshPath) {
    return { kind: "powershell", path: winPwshPath };
  }
  
  throw new Error(
    "PowerShell not found. Please install PowerShell (pwsh) or Windows PowerShell (powershell.exe)."
  );
}
