import { randomUUID } from "node:crypto";
import {
  mkdir,
  readdir,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const MAX_LINES = 2000;
export const MAX_BYTES = 50 * 1024;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

export interface TruncateOptions {
  maxLines?: number;
  maxBytes?: number;
  direction?: "head" | "tail";
}

export type TruncateResult =
  | { content: string; truncated: false }
  | { content: string; truncated: true; outputPath: string };

interface DataDirRuntime {
  env?: NodeJS.ProcessEnv;
  platform?: NodeJS.Platform;
  homeDir?: string;
}

export function resolveOpenCodeDataDir(runtime: DataDirRuntime = {}): string {
  const env = runtime.env ?? process.env;
  const platform = runtime.platform ?? process.platform;
  const homeDir = runtime.homeDir ?? os.homedir();
  const pathApi = platform === "win32" ? path.win32 : path.posix;

  const override = env.OPENCODE_PLUGIN_DATA_DIR;
  if (override) return override;

  if (env.XDG_DATA_HOME) {
    return pathApi.join(env.XDG_DATA_HOME, "opencode");
  }

  if (platform === "darwin") {
    return pathApi.join(homeDir, "Library", "Application Support", "opencode");
  }

  if (platform === "win32") {
    const localAppData =
      env.LOCALAPPDATA ?? pathApi.join(homeDir, "AppData", "Local");
    return pathApi.join(localAppData, "opencode");
  }

  return pathApi.join(homeDir, ".local", "share", "opencode");
}

export function resolveToolOutputDir(): string {
  return path.join(resolveOpenCodeDataDir(), "tool-output");
}

export async function truncateToolOutput(
  text: string,
  options: TruncateOptions = {}
): Promise<TruncateResult> {
  const maxLines = options.maxLines ?? MAX_LINES;
  const maxBytes = options.maxBytes ?? MAX_BYTES;
  const direction = options.direction ?? "head";

  const lines = text.split("\n");
  const totalBytes = Buffer.byteLength(text, "utf-8");
  if (lines.length <= maxLines && totalBytes <= maxBytes) {
    return { content: text, truncated: false };
  }

  const out: string[] = [];
  let bytes = 0;
  let hitBytes = false;

  if (direction === "head") {
    for (let i = 0; i < lines.length && i < maxLines; i++) {
      const size = Buffer.byteLength(lines[i], "utf-8") + (i > 0 ? 1 : 0);
      if (bytes + size > maxBytes) {
        hitBytes = true;
        break;
      }
      out.push(lines[i]);
      bytes += size;
    }
  } else {
    for (let i = lines.length - 1; i >= 0 && out.length < maxLines; i--) {
      const size = Buffer.byteLength(lines[i], "utf-8") + (out.length > 0 ? 1 : 0);
      if (bytes + size > maxBytes) {
        hitBytes = true;
        break;
      }
      out.unshift(lines[i]);
      bytes += size;
    }
  }

  const removed = hitBytes ? totalBytes - bytes : lines.length - out.length;
  const unit = hitBytes ? "bytes" : "lines";
  const preview = out.join("\n");

  const outputPath = await writeFullOutput(text);
  const hint =
    `The tool call succeeded but the output was truncated. Full output saved to: ${outputPath}\n` +
    "Use Grep to search the full content or Read with offset/limit to view specific sections.";

  const message =
    direction === "head"
      ? `${preview}\n\n...${removed} ${unit} truncated...\n\n${hint}`
      : `...${removed} ${unit} truncated...\n\n${hint}\n\n${preview}`;

  return {
    content: message,
    truncated: true,
    outputPath,
  };
}

async function writeFullOutput(text: string): Promise<string> {
  const dir = resolveToolOutputDir();
  await mkdir(dir, { recursive: true });

  const filename = `tool_${Date.now()}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const outputPath = path.join(dir, filename);
  await writeFile(outputPath, text, "utf-8");

  void cleanupOldToolOutputFiles(dir);

  return outputPath;
}

async function cleanupOldToolOutputFiles(dir: string): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    const filepath = path.join(dir, entry.name);
    const fileStat = await stat(filepath).catch(() => null);
    if (!fileStat) continue;

    if (fileStat.mtimeMs < cutoff) {
      await unlink(filepath).catch(() => {});
    }
  }
}
