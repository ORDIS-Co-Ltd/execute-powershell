import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import type { Plugin } from "@opencode-ai/plugin";

async function discoverLocalPlugins(projectRoot: string): Promise<Map<string, Plugin>> {
  const discovered = new Map<string, Plugin>();
  const pluginsRoot = path.join(projectRoot, ".opencode/plugins");
  const entries = await fs.readdir(pluginsRoot, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pluginEntry = path.join(pluginsRoot, entry.name, "index.js");
    try {
      await fs.access(pluginEntry);
    } catch {
      continue;
    }

    const moduleUrl = `${pathToFileURL(pluginEntry).href}?v=${Date.now()}`;
    const mod = await import(moduleUrl);
    if (typeof mod.ExecutePowerShellPlugin === "function") {
      discovered.set(entry.name, mod.ExecutePowerShellPlugin as Plugin);
    }
  }

  return discovered;
}

describe("plugin loading from local .opencode/plugins directory", () => {
  const projectRoot = process.cwd();
  const fixtureRoot = path.join(projectRoot, "tmp/local-plugin-loader-fixture");
  const fixturePluginDir = path.join(
    fixtureRoot,
    ".opencode/plugins/execute-powershell"
  );
  const fixturePluginEntry = path.join(fixturePluginDir, "index.js");

  beforeAll(async () => {
    await fs.mkdir(fixturePluginDir, { recursive: true });
    await fs.writeFile(
      fixturePluginEntry,
      `export { ExecutePowerShellPlugin } from ${JSON.stringify(path.join(projectRoot, "src/index.js"))};\n`
    );
  });

  afterAll(async () => {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  });

  it("discovers plugin from .opencode/plugins using directory scan", async () => {
    const discovered = await discoverLocalPlugins(fixtureRoot);

    expect(discovered.has("execute-powershell")).toBe(true);
    expect(typeof discovered.get("execute-powershell")).toBe("function");
  });

  it("loads plugin and registers execute_powershell tool", async () => {
    const discovered = await discoverLocalPlugins(fixtureRoot);
    const plugin = discovered.get("execute-powershell");

    expect(plugin).toBeDefined();

    const hooks = await plugin!({
      client: {} as any,
      project: {} as any,
      directory: fixtureRoot,
      worktree: fixtureRoot,
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.execute_powershell).toBeDefined();
    expect(typeof hooks.tool?.execute_powershell.execute).toBe("function");
  });
});
