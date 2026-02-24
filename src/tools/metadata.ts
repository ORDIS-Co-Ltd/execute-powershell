/**
 * Metadata footer for PowerShell execution outcomes.
 *
 * This module provides functions to format and parse metadata footers
 * that are appended to PowerShell command output. The footer uses a
 * tagged JSON format that can be easily extracted and parsed.
 */

/**
 * Metadata about a PowerShell execution outcome.
 */
export interface PowerShellMetadata {
  /** Exit code from the PowerShell process */
  exitCode: number;
  /** How the execution ended: "exit" (normal), "timeout", or "abort" */
  endedBy: "exit" | "timeout" | "abort";
  /** Shell identifier (e.g., "powershell", "pwsh") */
  shell: string;
  /** Resolved absolute path of the working directory */
  resolvedWorkdir: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Duration of execution in milliseconds */
  durationMs: number;
}

/**
 * Format metadata as a tagged JSON footer.
 *
 * The footer format is: <powershell_metadata>{"exitCode": ..., ...}</powershell_metadata>
 *
 * @param meta - The metadata to format
 * @returns The formatted metadata footer string
 */
export function formatMetadataFooter(meta: PowerShellMetadata): string {
  return `<powershell_metadata>${JSON.stringify(meta)}</powershell_metadata>`;
}

/**
 * Parse a metadata footer from text.
 *
 * Extracts and parses the tagged JSON metadata from the end of text.
 * Returns null if no valid metadata footer is found.
 *
 * @param text - The text to parse
 * @returns The parsed metadata, or null if not found
 */
export function parseMetadataFooter(text: string): PowerShellMetadata | null {
  // Find ALL matches and take the LAST one (the actual footer, not any
  // metadata-like text that might appear in command output)
  const matches = [...text.matchAll(/<powershell_metadata>(.+?)<\/powershell_metadata>/gs)];
  if (matches.length === 0) return null;

  const lastMatch = matches[matches.length - 1];
  try {
    const parsed = JSON.parse(lastMatch[1]);
    // Validate all required fields
    if (
      typeof parsed.exitCode !== "number" ||
      !["exit", "timeout", "abort"].includes(parsed.endedBy) ||
      typeof parsed.shell !== "string" ||
      typeof parsed.resolvedWorkdir !== "string" ||
      typeof parsed.timeoutMs !== "number" ||
      typeof parsed.durationMs !== "number"
    ) {
      return null;
    }
    return parsed as PowerShellMetadata;
  } catch {
    return null;
  }
}
