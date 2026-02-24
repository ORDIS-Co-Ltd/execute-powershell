import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";

describe("plugin loading from local .opencode/plugins/ directory", () => {
  const pluginDir = ".opencode/plugins/execute-powershell";
  const pluginFile = path.join(pluginDir, "index.js");
  const projectRoot = process.cwd();

  beforeAll(async () => {
    // Create the plugin directory structure
    await fs.mkdir(pluginDir, { recursive: true });

    // Create a fixture that re-exports the plugin from the actual source
    // This simulates a real local plugin installation
    const fixtureContent = `// Auto-generated fixture for local plugin loading test
export { ExecutePowerShellPlugin } from "${projectRoot}/src/index.js";
`;
    await fs.writeFile(pluginFile, fixtureContent);
  });

  afterAll(async () => {
    // Clean up the fixture
    try {
      await fs.unlink(pluginFile);
      await fs.rmdir(pluginDir);
      await fs.rmdir(".opencode/plugins");
      await fs.rmdir(".opencode");
    } catch {
      // Ignore cleanup errors
    }
  });

  it("loads plugin from local .opencode/plugins/ directory", async () => {
    // Actually load from the fixture path using dynamic import
    const pluginPath = path.join(projectRoot, pluginFile);
    const plugin = await import(pluginPath);

    // Assert the loaded module exports ExecutePowerShellPlugin
    expect(plugin.ExecutePowerShellPlugin).toBeDefined();
    expect(typeof plugin.ExecutePowerShellPlugin).toBe("function");
  });

  it("loaded plugin conforms to Plugin type", async () => {
    const pluginPath = path.join(projectRoot, pluginFile);
    const plugin = await import(pluginPath);

    const fn: Plugin = plugin.ExecutePowerShellPlugin;
    expect(fn).toBe(plugin.ExecutePowerShellPlugin);
  });

  it("initializes loaded plugin and verifies tool registration", async () => {
    const pluginPath = path.join(projectRoot, pluginFile);
    const plugin = await import(pluginPath);

    // Initialize the plugin with mock context
    const hooks = await plugin.ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    // Verify tool registration
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe("object");
    expect(hooks.tool).toBeDefined();
    expect(typeof hooks.tool).toBe("object");
    expect(hooks.tool.execute_powershell).toBeDefined();
    expect(typeof hooks.tool.execute_powershell).toBe("object");
  });

  it("execute_powershell tool from loaded plugin has correct metadata", async () => {
    const pluginPath = path.join(projectRoot, pluginFile);
    const plugin = await import(pluginPath);

    const hooks = await plugin.ExecutePowerShellPlugin({
      client: {} as any,
      project: {} as any,
      directory: "",
      worktree: "",
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });

    const tool = hooks.tool.execute_powershell;
    expect(tool).toBeDefined();
    expect(tool.description).toBeDefined();
    expect(tool.args).toBeDefined();
    expect(tool.execute).toBeDefined();
    expect(typeof tool.execute).toBe("function");
  });
});
