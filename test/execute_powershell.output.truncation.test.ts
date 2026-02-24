import { describe, it, expect, mock, beforeEach } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index.js";
import { parseMetadataFooter } from "../src/tools/metadata.js";
import type { ToolDefinition } from "@opencode-ai/plugin";

describe("Output Truncation Non-Interference", () => {
  // Skip all tests on non-Windows platforms
  if (process.platform !== "win32") {
    it.skip("skipped on non-Windows platform", () => {});
    return;
  }

  let toolDef: ToolDefinition;

  beforeEach(async () => {
    const hooks = await ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: process.cwd(),
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });
    toolDef = hooks.tool?.execute_powershell as ToolDefinition;
  });

  async function mockContext(overrides: Partial<{
    directory: string;
    abort: AbortSignal;
    ask: (req: any) => Promise<any>;
  }> = {}) {
    return {
      sessionID: "test-session",
      messageID: "test-message",
      agent: "test-agent",
      directory: overrides.directory ?? process.cwd(),
      worktree: "",
      abort: overrides.abort ?? new AbortController().signal,
      metadata: () => {},
      ask: overrides.ask ?? mock(() => Promise.resolve()),
    };
  }

  it("preserves full output without truncation", async () => {
    // Generate known-size output deterministically
    const line = "A".repeat(100);
    const lines = 500; // 50KB of ASCII
    const command = `for ($i = 0; $i -lt ${lines}; $i++) { Write-Host "${line}" }`;
    
    const context = await mockContext();
    const result = await toolDef.execute(
      {
        command,
        description: "Generate 50KB of ASCII output to test truncation behavior",
        timeout_ms: 60000,
      },
      context as any
    );

    // Verify the result is a string
    expect(typeof result).toBe("string");
    
    // Extract metadata footer to verify it's present and intact
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.exitCode).toBe(0);
    expect(metadata?.endedBy).toBe("exit");
    
    // Verify no truncation markers are present
    // Common truncation indicators that should NOT appear in plugin output
    const truncationMarkers = [
      "...[truncated]",
      "[output truncated]",
      "... (truncated)",
      "[truncated]",
      "<truncated>",
      "[Output truncated",
      "(truncated)",
    ];
    
    for (const marker of truncationMarkers) {
      expect(result).not.toContain(marker);
    }
    
    // Verify exact expected output - full content preservation
    expect(result).toContain(line);
    
    // Count occurrences of the exact line pattern
    const matches = result.split(line).length - 1;
    expect(matches).toBe(lines);
    
    // Verify footer is present at the end
    expect(result).toContain("<powershell_metadata>");
    expect(result).toContain("</powershell_metadata>");
    expect(result.endsWith("</powershell_metadata>")).toBe(true);
  });

  it("preserves full multi-line output without truncation", async () => {
    const context = await mockContext();
    
    // Generate many lines of output
    const lineCount = 5000;
    
    const result = await toolDef.execute(
      {
        command: `
          for ($i = 0; $i -lt ${lineCount}; $i++) {
            Write-Host "LINE_$($i.ToString().PadLeft(6, '0'))_CONTENT"
          }
        `,
        description: "Generate many lines to test line-based truncation",
        timeout_ms: 60000,
      },
      context as any
    );

    // Verify metadata footer is present
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.exitCode).toBe(0);
    
    // Verify no truncation markers
    expect(result).not.toContain("...[truncated]");
    expect(result).not.toContain("[truncated]");
    
    // Verify content contains expected line patterns - first and last lines
    expect(result).toContain("LINE_000000_CONTENT");
    expect(result).toContain("LINE_004999_CONTENT");
    
    // Verify full output preservation by checking all line patterns are present
    // Each line has a unique index, so we can verify completeness
    let lineMatches = 0;
    for (let i = 0; i < lineCount; i++) {
      const linePattern = `LINE_${i.toString().padStart(6, '0')}_CONTENT`;
      if (result.includes(linePattern)) {
        lineMatches++;
      }
    }
    expect(lineMatches).toBe(lineCount);
  });

  it("preserves full output with mixed content without truncation", async () => {
    const context = await mockContext();
    
    // Generate mixed stdout/stderr output
    const result = await toolDef.execute(
      {
        command: `
          $largeText = "X" * 50000
          Write-Host $largeText
          Write-Error $largeText 2>&1
          Write-Host $largeText
        `,
        description: "Generate mixed stdout/stderr large output",
        timeout_ms: 60000,
      },
      context as any
    );

    // Verify metadata footer is present
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.exitCode).toBe(0);
    
    // Verify no truncation markers
    expect(result).not.toContain("...[truncated]");
    expect(result).not.toContain("[truncated]");
    
    // Verify output contains all expected content
    // Content pattern is repeated 3 times (Write-Host X, Write-Error X, Write-Host X)
    const contentOnly = result.replace(/<powershell_metadata>.*<\/powershell_metadata>/s, "");
    const xCount = (contentOnly.match(/X/g) || []).length;
    // Should have exactly 3 * 50000 = 150000 X characters
    expect(xCount).toBe(150000);
    
    // Verify footer is at the very end (no truncation after footer)
    expect(result.endsWith("</powershell_metadata>")).toBe(true);
  });

  it("verifies plugin performs no manual byte-limit truncation", async () => {
    const context = await mockContext();
    
    // Generate output that would trigger byte-limit truncation if implemented
    const largeContent = "B".repeat(200 * 1024); // 200KB of content
    
    const result = await toolDef.execute(
      {
        command: `Write-Host '${largeContent}'`,
        description: "Test for byte-limit truncation",
        timeout_ms: 60000,
      },
      context as any
    );

    // Verify metadata
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    
    // Verify the content is not clipped at arbitrary byte boundaries
    // Content should end naturally, not at a round number like 65536, 131072, etc.
    const contentOnly = result.replace(/<powershell_metadata>.*<\/powershell_metadata>/s, "");
    
    // Verify the 'B' characters are present in exact expected quantity
    const bCount = (contentOnly.match(/B/g) || []).length;
    expect(bCount).toBe(200 * 1024); // Exactly 200KB of B characters
    
    // Verify no suspicious truncation at common byte boundaries
    const suspiciousBoundaries = [65536, 131072, 262144, 1048576];
    for (const boundary of suspiciousBoundaries) {
      // Length should not be exactly at a boundary (would suggest hard limit)
      expect(result.length).not.toBe(boundary);
      // Content length should not be exactly at a boundary
      expect(contentOnly.length).not.toBe(boundary);
    }
  });

  it("preserves output integrity with special characters without truncation", async () => {
    const context = await mockContext();
    
    // Generate deterministic output with special characters
    const charCount = 5000;
    
    const result = await toolDef.execute(
      {
        command: `
          $utf8Content = "漢字" * ${charCount}
          Write-Host $utf8Content -NoNewline
        `,
        description: "Test UTF-8 and special character preservation",
        timeout_ms: 60000,
      },
      context as any
    );

    // Verify metadata footer is present
    const metadata = parseMetadataFooter(result);
    expect(metadata).not.toBeNull();
    expect(metadata?.exitCode).toBe(0);
    
    // Verify no truncation markers
    expect(result).not.toContain("...[truncated]");
    expect(result).not.toContain("[truncated]");
    
    // Verify UTF-8 characters are preserved
    expect(result).toContain("漢字");
    
    // Count actual occurrences of the character
    const contentOnly = result.replace(/<powershell_metadata>.*<\/powershell_metadata>/s, "");
    const charMatches = contentOnly.split("漢字").length - 1;
    expect(charMatches).toBe(charCount);
  });
});
