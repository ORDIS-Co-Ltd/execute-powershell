import { describe, it, expect, beforeEach, afterEach, mock, spyOn } from "bun:test";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { execute_powershell } from "../src/tools/execute_powershell.js";
import { parseMetadataFooter } from "../src/tools/metadata.js";
import {
  truncateToolOutput,
  resolveOpenCodeDataDir,
  resolveToolOutputDir,
} from "../src/tools/truncation.js";
import * as powershellExe from "../src/tools/powershell_exe.js";

function createStreamFromString(text: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

function createMockContext(overrides?: Partial<{ ask: (req: any) => Promise<void> }>) {
  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "test-agent",
    directory: "/home/user/project",
    worktree: "/home/user/project",
    abort: new AbortController().signal,
    metadata: () => {},
    ask: overrides?.ask ?? mock(async () => {}),
  };
}

describe("output truncation", () => {
  const tmpDataRoot = path.join(process.cwd(), "tmp", "truncation-test-data");
  let originalDataDirEnv: string | undefined;

  beforeEach(async () => {
    originalDataDirEnv = process.env.OPENCODE_PLUGIN_DATA_DIR;
    process.env.OPENCODE_PLUGIN_DATA_DIR = tmpDataRoot;
    await rm(tmpDataRoot, { recursive: true, force: true });
  });

  afterEach(async () => {
    if (originalDataDirEnv === undefined) {
      delete process.env.OPENCODE_PLUGIN_DATA_DIR;
    } else {
      process.env.OPENCODE_PLUGIN_DATA_DIR = originalDataDirEnv;
    }
    await rm(tmpDataRoot, { recursive: true, force: true });
  });

  it("does not truncate output within limits", async () => {
    const result = await truncateToolOutput("line1\nline2\nline3");

    expect(result.truncated).toBe(false);
    expect(result.content).toBe("line1\nline2\nline3");
  });

  it("resolves OpenCode data directory with override and platform fallbacks", () => {
    const override = resolveOpenCodeDataDir({
      env: { OPENCODE_PLUGIN_DATA_DIR: "/tmp/custom-opencode-data" },
      platform: "darwin",
      homeDir: "/Users/test",
    });
    expect(override).toBe("/tmp/custom-opencode-data");

    const xdg = resolveOpenCodeDataDir({
      env: { XDG_DATA_HOME: "/tmp/xdg-data" },
      platform: "linux",
      homeDir: "/home/test",
    });
    expect(xdg).toBe("/tmp/xdg-data/opencode");

    const darwin = resolveOpenCodeDataDir({
      env: {},
      platform: "darwin",
      homeDir: "/Users/test",
    });
    expect(darwin).toBe("/Users/test/Library/Application Support/opencode");

    const win32 = resolveOpenCodeDataDir({
      env: { LOCALAPPDATA: "C:\\Users\\test\\AppData\\Local" },
      platform: "win32",
      homeDir: "C:\\Users\\test",
    });
    expect(win32).toBe("C:\\Users\\test\\AppData\\Local\\opencode");

    const linux = resolveOpenCodeDataDir({
      env: {},
      platform: "linux",
      homeDir: "/home/test",
    });
    expect(linux).toBe("/home/test/.local/share/opencode");
  });

  it("truncates by line count and writes full output file", async () => {
    const content = Array.from({ length: 100 }, (_, i) => `line-${i}`).join("\n");

    const result = await truncateToolOutput(content, {
      maxLines: 10,
      maxBytes: 100000,
    });

    expect(result.truncated).toBe(true);
    if (!result.truncated) return;

    expect(result.content).toContain("...90 lines truncated...");
    expect(result.content).toContain("The tool call succeeded but the output was truncated");
    expect(result.outputPath).toContain(resolveToolOutputDir());

    const saved = await readFile(result.outputPath, "utf-8");
    expect(saved).toBe(content);
  });

  it("truncates by byte count and writes full output file", async () => {
    const content = "A".repeat(2000);

    const result = await truncateToolOutput(content, {
      maxLines: 2000,
      maxBytes: 100,
    });

    expect(result.truncated).toBe(true);
    if (!result.truncated) return;

    expect(result.content).toContain("bytes truncated...");

    const saved = await readFile(result.outputPath, "utf-8");
    expect(saved).toBe(content);
  });

  it("supports tail-direction previews", async () => {
    const content = Array.from({ length: 50 }, (_, i) => `line-${i}`).join("\n");

    const result = await truncateToolOutput(content, {
      maxLines: 5,
      maxBytes: 100000,
      direction: "tail",
    });

    expect(result.truncated).toBe(true);
    expect(result.content).toContain("line-49");
    expect(result.content).not.toContain("line-0");
  });

  it("truncates by bytes in tail-direction mode", async () => {
    const content = Array.from({ length: 100 }, (_, i) => `line-${i}-` + "X".repeat(40)).join("\n");

    const result = await truncateToolOutput(content, {
      maxLines: 100,
      maxBytes: 200,
      direction: "tail",
    });

    expect(result.truncated).toBe(true);
    expect(result.content).toContain("bytes truncated...");
  });

  it("returns truncated preview with metadata footer and outputPath", async () => {
    const originalBunSpawn = Bun.spawn;
    const resolverSpy = spyOn(
      powershellExe,
      "resolvePowerShellExecutable"
    ).mockReturnValue({
      kind: "pwsh",
      path: "pwsh",
    });

    const longOutput = Array.from({ length: 2500 }, (_, i) => `LONG_LINE_${i}`).join("\n");
    (Bun as unknown as { spawn: ReturnType<typeof mock> }).spawn = mock(() => {
      return {
        stdout: createStreamFromString(longOutput),
        stderr: createStreamFromString(""),
        stdin: { write: () => {} },
        exited: Promise.resolve(0),
        pid: 4242,
      } as unknown as ReturnType<typeof Bun.spawn>;
    });

    try {
      const result = await execute_powershell.execute(
        {
          command: "Write-Output 'test'",
          description: "Produce long output",
          timeout_ms: 30000,
        },
        createMockContext() as any
      );

      expect(result).toContain("The tool call succeeded but the output was truncated");
      expect(result.endsWith("</powershell_metadata>")).toBe(true);

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.truncated).toBe(true);
      expect(typeof metadata?.outputPath).toBe("string");

      const saved = await readFile(metadata!.outputPath!, "utf-8");
      expect(saved).toBe(longOutput);
      expect(result).not.toContain("LONG_LINE_2499");
    } finally {
      resolverSpy.mockRestore();
      (Bun as unknown as { spawn: typeof originalBunSpawn }).spawn = originalBunSpawn;
    }
  });

  it("truncates oversized error output in catch path", async () => {
    const resolverSpy = spyOn(
      powershellExe,
      "resolvePowerShellExecutable"
    ).mockImplementation(() => {
      throw new Error("E".repeat(60 * 1024));
    });

    try {
      const result = await execute_powershell.execute(
        {
          command: "Write-Output 'test'",
          description: "Produce long error output",
          timeout_ms: 30000,
        },
        createMockContext() as any
      );

      const metadata = parseMetadataFooter(result);
      expect(metadata).not.toBeNull();
      expect(metadata?.truncated).toBe(true);
      expect(typeof metadata?.outputPath).toBe("string");
      expect(result).toContain("bytes truncated...");
    } finally {
      resolverSpy.mockRestore();
    }
  });
});
