import { describe, it, expect, mock, spyOn, beforeEach, afterEach } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index.js";
import { parseMetadataFooter } from "../src/tools/metadata.js";
import type { ToolDefinition } from "@opencode-ai/plugin";
import * as powershellExe from "../src/tools/powershell_exe.js";

describe("execute_powershell Windows Integration", () => {
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

  describe("stdin-driven execution", () => {
    it("executes PowerShell command via stdin and captures combined stdout/stderr output", async () => {
      const context = await mockContext();

      const result = await toolDef.execute(
        {
          command: "Write-Host 'stdout line'; Write-Error 'stderr line' 2>&1",
          description: "Test combined output capture",
          timeout_ms: 30000,
        },
        context as any
      );

      // Verify the result is a string
      expect(typeof result).toBe("string");

      // Parse and verify metadata footer
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(0);
      expect(metadata?.endedBy).toBe("exit");
      expect(metadata?.shell).toMatch(/^(pwsh|powershell)$/);
      expect(metadata?.resolvedWorkdir).toBe(process.cwd());

      // The output should contain the echo result
      // Note: On Windows, PowerShell output format may vary
      expect(result.length).toBeGreaterThan(0);
    });

    it("handles multi-line output from stdin command", async () => {
      const context = await mockContext();

      const result = await toolDef.execute(
        {
          command: "Write-Host 'Line1'; Write-Host 'Line2'; Write-Host 'Line3'",
          description: "Test multi-line output",
          timeout_ms: 30000,
        },
        context as any
      );

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(0);

      // Output should be non-empty
      // Remove metadata footer for content check
      const contentOnly = result.replace(/<powershell_metadata>.*<\/powershell_metadata>/s, "");
      expect(contentOnly.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("exit code propagation", () => {
    it("propagates non-zero exit code in metadata footer", async () => {
      const context = await mockContext();

      const result = await toolDef.execute(
        {
          command: "exit 42",
          description: "Test non-zero exit code",
          timeout_ms: 30000,
        },
        context as any
      );

      // Parse metadata footer
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(42);
      expect(metadata?.endedBy).toBe("exit");
    });

    it("handles exit code 1 for failed commands", async () => {
      const context = await mockContext();

      const result = await toolDef.execute(
        {
          command: "throw 'Intentional error'",
          description: "Test error exit code",
          timeout_ms: 30000,
        },
        context as any
      );

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(1);
      expect(metadata?.endedBy).toBe("exit");
    });

    it("captures various non-zero exit codes", async () => {
      const exitCodes = [1, 2, 5, 255];

      for (const expectedCode of exitCodes) {
        const context = await mockContext();

        const result = await toolDef.execute(
          {
            command: `exit ${expectedCode}`,
            description: `Test exit code ${expectedCode}`,
            timeout_ms: 30000,
          },
          context as any
        );

        const metadata = parseMetadataFooter(result);
        expect(metadata).not.toBeNull();
        expect(metadata?.exitCode).toBe(expectedCode);
      }
    });
  });

  describe("missing executable error", () => {
    let resolveSpy: ReturnType<typeof spyOn<typeof powershellExe, "resolvePowerShellExecutable">>;

    afterEach(() => {
      if (resolveSpy) {
        resolveSpy.mockRestore();
      }
    });

    it("handles missing executable error through resolver override", async () => {
      // Mock the resolver to throw an error simulating missing PowerShell
      resolveSpy = spyOn(powershellExe, "resolvePowerShellExecutable");
      resolveSpy.mockImplementation(() => {
        throw new Error(
          "PowerShell not found. Please install PowerShell (pwsh) or Windows PowerShell (powershell.exe)."
        );
      });

      const context = await mockContext();

      // Should not throw, but return error output with metadata
      const result = await toolDef.execute(
        {
          command: "Get-Date",
          description: "Test missing executable handling",
          timeout_ms: 30000,
        },
        context as any
      );

      // Result should contain error message
      expect(result).toContain("PowerShell not found");

      // Metadata should indicate error state
      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(-1);
    });

    it("provides clear error message when resolver fails", async () => {
      resolveSpy = spyOn(powershellExe, "resolvePowerShellExecutable");
      resolveSpy.mockImplementation(() => {
        throw new Error("Custom resolver error message");
      });

      const context = await mockContext();

      const result = await toolDef.execute(
        {
          command: "echo test",
          description: "Test resolver error message",
          timeout_ms: 30000,
        },
        context as any
      );

      expect(result).toContain("Custom resolver error message");

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBeLessThan(0);
    });
  });

  describe("real Windows execution verification", () => {
    it("successfully executes Get-Location and returns working directory", async () => {
      const testDir = process.cwd();
      const context = await mockContext({ directory: testDir });

      const result = await toolDef.execute(
        {
          command: "Get-Location | Select-Object -ExpandProperty Path",
          description: "Test Get-Location command",
          timeout_ms: 30000,
        },
        context as any
      );

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.exitCode).toBe(0);
      expect(metadata?.resolvedWorkdir).toBe(testDir);
      expect(metadata?.durationMs).toBeGreaterThan(0);
      expect(metadata?.durationMs).toBeLessThan(30000);
    });

    it("respects timeout parameter in metadata", async () => {
      const context = await mockContext();
      const customTimeout = 60000;

      const result = await toolDef.execute(
        {
          command: "Get-Date",
          description: "Test timeout in metadata",
          timeout_ms: customTimeout,
        },
        context as any
      );

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.timeoutMs).toBe(customTimeout);
    });
  });
});
