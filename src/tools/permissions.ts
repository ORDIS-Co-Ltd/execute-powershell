/**
 * Derives the always permission pattern from a PowerShell command.
 * 
 * Rules:
 * 1. Tokenize by whitespace
 * 2. Skip leading tokens that equal '&' or '.'
 * 3. Return '<prefix> *' from the first remaining token
 */
export function deriveAlwaysPattern(command: string): string {
  // Trim whitespace and split by whitespace
  const tokens = command.trim().split(/\s+/).filter(token => token.length > 0);
  
  // Find the first non-skippable token
  for (const token of tokens) {
    // Skip leading tokens that equal '&' or '.'
    if (token === '&' || token === '.') {
      continue;
    }
    // Return pattern with wildcard
    return `${token} *`;
  }
  
  // Fallback: if no valid token found, throw error (fail-closed security)
  // This prevents over-broad permission patterns from being generated
  throw new Error("Cannot derive permission pattern: no valid command token found");
}
