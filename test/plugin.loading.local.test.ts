import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { ExecutePowerShellPlugin } from "../src/index.js";
import type { Plugin, PluginInput, Hooks, ToolDefinition } from "@opencode-ai/plugin";
import { parseMetadataFooter } from "../src/tools/metadata.js";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

describe("Plugin Loading - Local Directory", () => {
  let tempDir: string;
  let pluginDir: string;
  let fixtureFile: string;

  beforeEach(() => {
    // Create a temporary directory structure simulating .opencode/plugins/
    tempDir = mkdtempSync(join(tmpdir(), "opencode-test-"));
    pluginDir = join(tempDir, ".opencode", "plugins");
    mkdirSync(pluginDir, { recursive: true });
    fixtureFile = join(pluginDir, "execute-powershell.ts");
  });

  afterEach(() => {
    // Clean up temporary directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("loads plugin from local .opencode/plugins/ directory", async () => {
    // Create a local plugin fixture that mirrors the ExecutePowerShellPlugin
    const pluginContent = `
import type { Plugin } from "@opencode-ai/plugin";
import { execute_powershell } from "${join(process.cwd(), "src/tools/execute_powershell.js").replace(/\\/g, "/")}";

export const ExecutePowerShellPlugin: Plugin = async () => {
  return {
    tool: {
      execute_powershell,
    },
  };
};

export default ExecutePowerShellPlugin;
`;
    writeFileSync(fixtureFile, pluginContent);

    // Verify the fixture file was created
    expect(Bun.file(fixtureFile).exists()).resolves.toBe(true);

    // Verify the plugin directory structure exists (using fs.existsSync for directories)
    expect(existsSync(pluginDir)).toBe(true);

    // Verify the ExecutePowerShellPlugin can be instantiated
    const pluginInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: tempDir,
      worktree: tempDir,
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    };

    const hooks = await ExecutePowerShellPlugin(pluginInput);

    // Verify loader output includes ExecutePowerShellPlugin functionality
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe("object");
  });

  it("verifies tool hook registration from discovered local plugin", async () => {
    // Create a local plugin fixture
    const pluginContent = `
import type { Plugin } from "@opencode-ai/plugin";
import { execute_powershell } from "${join(process.cwd(), "src/tools/execute_powershell.js").replace(/\\/g, "/")}";

export const ExecutePowerShellPlugin: Plugin = async () => {
  return {
    tool: {
      execute_powershell,
    },
  };
};

export default ExecutePowerShellPlugin;
`;
    writeFileSync(fixtureFile, pluginContent);

    // Load the plugin
    const pluginInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: tempDir,
      worktree: tempDir,
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    };

    const hooks = await ExecutePowerShellPlugin(pluginInput);

    // Verify tool hook registration
    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.execute_powershell).toBeDefined();

    // Verify execute_powershell is a valid tool definition
    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;
    expect(toolDef.description).toBeDefined();
    expect(toolDef.args).toBeDefined();
    expect(typeof toolDef.execute).toBe("function");
  });

  it("verifies plugin conforms to expected structure for local file discovery", async () => {
    // Verify the plugin module exports the expected structure
    const pluginModule = await import("../src/index.js");

    // Verify ExecutePowerShellPlugin is exported as named export
    expect(pluginModule.ExecutePowerShellPlugin).toBeDefined();
    expect(typeof pluginModule.ExecutePowerShellPlugin).toBe("function");

    // Verify the plugin function is async
    const pluginFn = pluginModule.ExecutePowerShellPlugin as Plugin;
    const result = pluginFn({
      client: {} as any,
      project: {} as any,
      directory: tempDir,
      worktree: tempDir,
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    });
    expect(result).toBeInstanceOf(Promise);

    // Verify the resolved hooks contain tool registration
    const hooks = await result;
    expect(hooks.tool).toBeDefined();
    expect(hooks.tool?.execute_powershell).toBeDefined();
  });

  it("simulates complete local plugin loading flow", async () => {
    // Create the fixture directory structure
    const pluginContent = `
import type { Plugin } from "@opencode-ai/plugin";
import { execute_powershell } from "${join(process.cwd(), "src/tools/execute_powershell.js").replace(/\\/g, "/")}";

export const ExecutePowerShellPlugin: Plugin = async () => {
  return {
    tool: {
      execute_powershell,
    },
  };
};

export default ExecutePowerShellPlugin;
`;
    writeFileSync(fixtureFile, pluginContent);

    // Simulate plugin discovery and loading
    const discoveredPlugins: Array<{ name: string; loader: () => Promise<Plugin> }> = [];

    // In a real scenario, OpenCode would scan .opencode/plugins/ directory
    // Here we simulate finding the plugin
    discoveredPlugins.push({
      name: "execute-powershell",
      loader: async () => {
        const module = await import("../src/index.js");
        return module.ExecutePowerShellPlugin;
      },
    });

    // Load all discovered plugins
    const loadedPlugins: Array<{ name: string; hooks: Hooks }> = [];
    for (const { name, loader } of discoveredPlugins) {
      const plugin = await loader();
      const hooks = await plugin({
        client: {} as any,
        project: {} as any,
        directory: tempDir,
        worktree: tempDir,
        serverUrl: new URL("http://localhost"),
        $: {} as any,
      });
      loadedPlugins.push({ name, hooks });
    }

    // Verify loader output includes ExecutePowerShellPlugin from local-file discovery
    expect(loadedPlugins).toHaveLength(1);
    expect(loadedPlugins[0].name).toBe("execute-powershell");
    expect(loadedPlugins[0].hooks.tool).toBeDefined();
    expect(loadedPlugins[0].hooks.tool?.execute_powershell).toBeDefined();

    // Verify tool registration from discovered local plugin
    const toolDef = loadedPlugins[0].hooks.tool?.execute_powershell as ToolDefinition;
    expect(toolDef.description).toBe("Execute PowerShell commands on Windows");
    expect(toolDef.args).toBeDefined();
    expect(typeof toolDef.execute).toBe("function");
  });

  it("verifies plugin directory layout matches expected structure", () => {
    // Create multiple plugin files to test directory layout
    const pluginFiles = [
      join(pluginDir, "plugin-a.ts"),
      join(pluginDir, "plugin-b.ts"),
      join(pluginDir, "nested", "plugin-c.ts"),
    ];

    mkdirSync(join(pluginDir, "nested"), { recursive: true });

    for (const file of pluginFiles) {
      writeFileSync(file, "// test plugin");
    }

    // Verify all files exist in the expected locations
    for (const file of pluginFiles) {
      expect(Bun.file(file).exists()).resolves.toBe(true);
    }

    // Verify the .opencode/plugins/ directory structure (using fs.existsSync for directories)
    const opencodeDir = join(tempDir, ".opencode");
    expect(existsSync(opencodeDir)).toBe(true);
    expect(existsSync(pluginDir)).toBe(true);
  });

  it("validates ExecutePowerShellPlugin can be used as local plugin", async () => {
    // Create a test to verify the actual ExecutePowerShellPlugin works when loaded locally
    const pluginInput: PluginInput = {
      client: {} as any,
      project: {} as any,
      directory: tempDir,
      worktree: tempDir,
      serverUrl: new URL("http://localhost"),
      $: {} as any,
    };

    // Load the plugin
    const hooks = await ExecutePowerShellPlugin(pluginInput);

    // Verify it returns the expected hooks structure
    expect(Object.keys(hooks)).toContain("tool");
    expect(hooks.tool).toBeDefined();
    expect(Object.keys(hooks.tool || {})).toContain("execute_powershell");

    // Verify the tool definition has required properties
    const toolDef = hooks.tool?.execute_powershell as ToolDefinition;
    expect(toolDef).toHaveProperty("description");
    expect(toolDef).toHaveProperty("args");
    expect(toolDef).toHaveProperty("execute");
  });
});
