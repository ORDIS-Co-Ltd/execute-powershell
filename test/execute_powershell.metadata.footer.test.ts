import { describe, it, expect } from "bun:test";
import { 
  formatMetadataFooter, 
  parseMetadataFooter, 
  type PowerShellMetadata 
} from "../src/tools/metadata.js";

describe("formatMetadataFooter", () => {
  it("produces correct tagged format for valid metadata", () => {
    const meta: PowerShellMetadata = {
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/path/to/workdir",
      timeoutMs: 120000,
      durationMs: 1500
    };

    const result = formatMetadataFooter(meta);

    expect(result).toMatch(/^\u003cpowershell_metadata\u003e.+\u003c\/powershell_metadata\u003e$/);
    expect(result).toContain('"exitCode":0');
    expect(result).toContain('"endedBy":"exit"');
    expect(result).toContain('"shell":"powershell"');
    expect(result).toContain('"resolvedWorkdir":"/path/to/workdir"');
    expect(result).toContain('"timeoutMs":120000');
    expect(result).toContain('"durationMs":1500');
  });

  it("handles different endedBy values", () => {
    const exitMeta: PowerShellMetadata = {
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/workdir",
      timeoutMs: 120000,
      durationMs: 1000
    };

    const timeoutMeta: PowerShellMetadata = {
      exitCode: 1,
      endedBy: "timeout",
      shell: "pwsh",
      resolvedWorkdir: "/workdir",
      timeoutMs: 5000,
      durationMs: 5000
    };

    const abortMeta: PowerShellMetadata = {
      exitCode: -1,
      endedBy: "abort",
      shell: "powershell",
      resolvedWorkdir: "/workdir",
      timeoutMs: 120000,
      durationMs: 500
    };

    expect(formatMetadataFooter(exitMeta)).toContain('"endedBy":"exit"');
    expect(formatMetadataFooter(timeoutMeta)).toContain('"endedBy":"timeout"');
    expect(formatMetadataFooter(abortMeta)).toContain('"endedBy":"abort"');
  });

  it("handles zero values correctly", () => {
    const meta: PowerShellMetadata = {
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/workdir",
      timeoutMs: 0,
      durationMs: 0
    };

    const result = formatMetadataFooter(meta);

    expect(result).toContain('"timeoutMs":0');
    expect(result).toContain('"durationMs":0');
    expect(result).toContain('"exitCode":0');
  });

  it("handles special characters in paths", () => {
    const meta: PowerShellMetadata = {
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/path with spaces/and\\backslashes",
      timeoutMs: 120000,
      durationMs: 1000
    };

    const result = formatMetadataFooter(meta);
    
    // JSON should properly escape special characters
    expect(result).toContain('"resolvedWorkdir":"/path with spaces/and\\\\backslashes"');
  });

  it("handles large numeric values", () => {
    const meta: PowerShellMetadata = {
      exitCode: 99999,
      endedBy: "exit",
      shell: "pwsh",
      resolvedWorkdir: "/workdir",
      timeoutMs: 86400000,
      durationMs: 3600000
    };

    const result = formatMetadataFooter(meta);

    expect(result).toContain('"exitCode":99999');
    expect(result).toContain('"timeoutMs":86400000');
    expect(result).toContain('"durationMs":3600000');
  });
});

describe("parseMetadataFooter", () => {
  it("extracts and parses tagged metadata from text", () => {
    const text = `Some output here
More output
<powershell_metadata>{"exitCode":0,"endedBy":"exit","shell":"powershell","resolvedWorkdir":"/workdir","timeoutMs":120000,"durationMs":1500}</powershell_metadata>`;

    const result = parseMetadataFooter(text);

    expect(result).toEqual({
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/workdir",
      timeoutMs: 120000,
      durationMs: 1500
    });
  });

  it("returns null when no metadata footer is present", () => {
    const text = "Just some regular output without metadata";
    
    const result = parseMetadataFooter(text);

    expect(result).toBeNull();
  });

  it("returns null for malformed JSON in footer", () => {
    const text = "Output<powershell_metadata>{invalid json}</powershell_metadata>";
    
    const result = parseMetadataFooter(text);

    expect(result).toBeNull();
  });

  it("returns null for incomplete footer tag", () => {
    const text = "Output<powershell_metadata>{\"exitCode\":0}";
    
    const result = parseMetadataFooter(text);

    expect(result).toBeNull();
  });

  it("parses metadata with different endedBy values", () => {
    const exitText = "Output<powershell_metadata>{\"exitCode\":0,\"endedBy\":\"exit\",\"shell\":\"powershell\",\"resolvedWorkdir\":\"/workdir\",\"timeoutMs\":120000,\"durationMs\":1000}</powershell_metadata>";
    const timeoutText = "Output<powershell_metadata>{\"exitCode\":1,\"endedBy\":\"timeout\",\"shell\":\"pwsh\",\"resolvedWorkdir\":\"/workdir\",\"timeoutMs\":5000,\"durationMs\":5000}</powershell_metadata>";
    const abortText = "Output<powershell_metadata>{\"exitCode\":-1,\"endedBy\":\"abort\",\"shell\":\"powershell\",\"resolvedWorkdir\":\"/workdir\",\"timeoutMs\":120000,\"durationMs\":500}</powershell_metadata>";

    expect(parseMetadataFooter(exitText)?.endedBy).toBe("exit");
    expect(parseMetadataFooter(timeoutText)?.endedBy).toBe("timeout");
    expect(parseMetadataFooter(abortText)?.endedBy).toBe("abort");
  });

  it("handles empty output with metadata only", () => {
    const text = "<powershell_metadata>{\"exitCode\":0,\"endedBy\":\"exit\",\"shell\":\"powershell\",\"resolvedWorkdir\":\"/workdir\",\"timeoutMs\":120000,\"durationMs\":1000}</powershell_metadata>";

    const result = parseMetadataFooter(text);

    expect(result).toEqual({
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/workdir",
      timeoutMs: 120000,
      durationMs: 1000
    });
  });

  it("handles metadata with escaped characters", () => {
    const text = `Output<powershell_metadata>{"exitCode":0,"endedBy":"exit","shell":"powershell","resolvedWorkdir":"/path with spaces/and\\\\backslashes","timeoutMs":120000,"durationMs":1000}</powershell_metadata>`;

    const result = parseMetadataFooter(text);

    expect(result?.resolvedWorkdir).toBe("/path with spaces/and\\backslashes");
  });

  it("parses the LAST metadata footer when multiple are present", () => {
    // Simulates output that contains metadata-like text from command output,
    // followed by the actual footer
    const text = `Some output
First fake metadata: <powershell_metadata>{"exitCode":999,"endedBy":"exit","shell":"fake","resolvedWorkdir":"/fake","timeoutMs":0,"durationMs":0}</powershell_metadata>
More output here
<powershell_metadata>{"exitCode":0,"endedBy":"exit","shell":"powershell","resolvedWorkdir":"/real/workdir","timeoutMs":120000,"durationMs":1500}</powershell_metadata>`;

    const result = parseMetadataFooter(text);

    // Should return the LAST metadata, not the first
    expect(result).toEqual({
      exitCode: 0,
      endedBy: "exit",
      shell: "powershell",
      resolvedWorkdir: "/real/workdir",
      timeoutMs: 120000,
      durationMs: 1500
    });
  });
});

describe("round-trip", () => {
  it("format then parse returns equivalent metadata", () => {
    const original: PowerShellMetadata = {
      exitCode: 42,
      endedBy: "exit",
      shell: "pwsh",
      resolvedWorkdir: "/some/workdir/path",
      timeoutMs: 60000,
      durationMs: 2500
    };

    const formatted = formatMetadataFooter(original);
    const parsed = parseMetadataFooter(formatted);

    expect(parsed).toEqual(original);
  });

  it("format then parse with output prefix returns correct metadata", () => {
    const meta: PowerShellMetadata = {
      exitCode: 1,
      endedBy: "timeout",
      shell: "powershell",
      resolvedWorkdir: "/project/src",
      timeoutMs: 10000,
      durationMs: 10000
    };

    const output = `Command output
Error message
More output`;
    const formatted = output + formatMetadataFooter(meta);
    const parsed = parseMetadataFooter(formatted);

    expect(parsed).toEqual(meta);
  });

  it("multiple round-trips are consistent", () => {
    const metas: PowerShellMetadata[] = [
      {
        exitCode: 0,
        endedBy: "exit",
        shell: "powershell",
        resolvedWorkdir: "/workdir1",
        timeoutMs: 120000,
        durationMs: 1000
      },
      {
        exitCode: 1,
        endedBy: "timeout",
        shell: "pwsh",
        resolvedWorkdir: "/workdir2",
        timeoutMs: 5000,
        durationMs: 5000
      },
      {
        exitCode: -1,
        endedBy: "abort",
        shell: "powershell",
        resolvedWorkdir: "/workdir3",
        timeoutMs: 120000,
        durationMs: 500
      }
    ];

    for (const meta of metas) {
      const formatted = formatMetadataFooter(meta);
      const parsed = parseMetadataFooter(formatted);
      expect(parsed).toEqual(meta);
    }
  });
});
