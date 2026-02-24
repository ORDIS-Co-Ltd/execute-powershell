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
    const context = await mockContext();
    
    // Generate large output above typical truncation thresholds
    // OpenCode typically truncates at various thresholds (e.g., 25KB, 50KB, 100KB)
    // We generate ~150KB of output to ensure we're well above any threshold
    const targetSize = 150 * 1024; // 150KB
    const chunkSize = 1000;
    const numChunks = Math.ceil(targetSize / chunkSize);
    
    // Create a PowerShell command that generates deterministic large output
    // Using a string multiplication pattern to generate known content
    const result = await toolDef.execute(
      {
        command: `
          $chunk = "A" * ${chunkSize}
          for ($i = 0; $i -lt ${numChunks}; $i++) {
            Write-Host $chunk -NoNewline
          }
        `,
        description: "Generate large output to test truncation behavior",
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
    
    // Calculate expected minimum size (output + footer)
    const expectedMinSize = targetSize;
    expect(result.length).toBeGreaterThan(expectedMinSize);
    
    // Verify no truncation markers are present
    // Common truncation indicators that should NOT appear in plugin output
    const truncationMarkers = [
      "...[truncated]",
      "[output truncated]",
      "... (truncated)",
      "[truncated]",
      "...",
      "<truncated>",
      "[Output truncated",
      "(truncated)",
    ];
    
    for (const marker of truncationMarkers) {
      expect(result).not.toContain(marker);
    }
    
    // Verify the output content is complete by checking character count
    // Remove metadata footer for content verification
    const contentOnly = result.replace(/<powershell_metadata>.*<\/powershell_metadata>/s, "");
    expect(contentOnly.length).toBeGreaterThanOrEqual(targetSize * 0.95); // Allow 5% variance for line endings
    
    // Verify the content contains expected pattern (repeated 'A' characters)
    const aCount = (contentOnly.match(/A/g) || []).length;
    expect(aCount).toBeGreaterThanOrEqual(targetSize * 0.95);
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
    
    // Verify content contains expected line patterns
    expect(result).toContain("LINE_000000_CONTENT");
    expect(result).toContain("LINE_004999_CONTENT");
    
    // Count actual lines to verify completeness
    const lines = result.split("\n").filter(line => line.trim() !== "");
    // Should have approximately lineCount lines (plus possible stderr)
    expect(lines.length).toBeGreaterThanOrEqual(lineCount * 0.9);
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
    const xCount = (result.match(/X/g) || []).length;
    // Should have ~150KB of X characters (3 * 50000)
    expect(xCount).toBeGreaterThanOrEqual(140000);
    
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
    
    // Check that we have substantial content (not truncated to a small size)
    expect(contentOnly.length).toBeGreaterThan(100 * 1024); // At least 100KB
    
    // Verify no suspicious truncation at common byte boundaries
    const suspiciousBoundaries = [65536, 131072, 262144, 1048576];
    for (const boundary of suspiciousBoundaries) {
      // Length should not be exactly at a boundary (would suggest hard limit)
      expect(result.length).not.toBe(boundary);
      // Content length should not be exactly at a boundary
      expect(contentOnly.length).not.toBe(boundary);
    }
    
    // Verify the 'B' characters are present in expected quantity
    const bCount = (contentOnly.match(/B/g) || []).length;
    expect(bCount).toBeGreaterThanOrEqual(180000); // Allow for some encoding overhead
  });

  it("preserves output integrity with special characters without truncation", async () => {
    const context = await mockContext();
    
    // Generate output with special characters that might trigger edge cases
    const specialContent = "漢字".repeat(10000) + "🎉".repeat(5000) + "\n".repeat(1000);
    
    const result = await toolDef.execute(
      {
        command: `
          $utf8Content = "漢字" * 10000
          $emojiContent = "🎉" * 5000
          Write-Host $utf8Content -NoNewline
          Write-Host $emojiContent -NoNewline
          Write-Host ("" + [Environment]::NewLine) * 1000 -NoNewline
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
    expect(result).toContain("🎉");
    
    // Verify the output has substantial size (indicating no truncation)
    expect(result.length).toBeGreaterThan(50000);
  });
});
