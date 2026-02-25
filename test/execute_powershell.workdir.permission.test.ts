import { describe, it, expect, mock, beforeEach } from "bun:test";
import { execute_powershell } from "../src/tools/execute_powershell.js";
import { askExternalDirectoryIfRequired } from "../src/tools/workdir.js";

// Helper function to create a mock context
function createMockContext(overrides?: any) {
  const abortController = new AbortController();
  const askFn = mock(async () => {});

  return {
    sessionID: "test-session",
    messageID: "test-message",
    agent: "test-agent",
    directory: "/home/user/project",
    worktree: "/home/user/project/.worktrees/task-013",
    abort: abortController.signal,
    metadata: () => {},
    ask: askFn,
    ...overrides,
  };
}

describe("askExternalDirectoryIfRequired", () => {
  it("requests external_directory permission when workdir is outside boundary", async () => {
    const context = createMockContext();
    const externalPath = "/var/log/external";

    await askExternalDirectoryIfRequired(context as any, externalPath);

    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    expect(callArgs.permission).toBe("external_directory");
  });

  it("does NOT request permission when workdir is inside boundary (context.directory)", async () => {
    const context = createMockContext();
    const internalPath = "/home/user/project/src";

    await askExternalDirectoryIfRequired(context as any, internalPath);

    expect(context.ask).not.toHaveBeenCalled();
  });

  it("does NOT request permission when workdir is inside boundary (context.worktree)", async () => {
    const context = createMockContext();
    const worktreePath = "/home/user/project/.worktrees/task-013/build";

    await askExternalDirectoryIfRequired(context as any, worktreePath);

    expect(context.ask).not.toHaveBeenCalled();
  });

  it("glob pattern uses forward slash separators", async () => {
    const context = createMockContext();
    // Simulate Windows path with backslashes
    const windowsPath = "C:\\\\Users\\\\External\\\\Project";

    await askExternalDirectoryIfRequired(context as any, windowsPath);

    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    const globPattern = callArgs.patterns[0];
    
    // Verify no backslashes remain
    expect(globPattern).not.toContain("\\");
    // Verify forward slashes are used
    expect(globPattern).toContain("/");
    // Verify pattern ends with /**
    expect(globPattern).toEndWith("/**");
  });

  it("glob pattern ends with /** for recursive access", async () => {
    const context = createMockContext();
    const externalPath = "/var/log/external";

    await askExternalDirectoryIfRequired(context as any, externalPath);

    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    expect(callArgs.patterns[0]).toBe("/var/log/external/**");
  });

  it("includes always pattern matching the glob pattern", async () => {
    const context = createMockContext();
    const externalPath = "/var/log/external";

    await askExternalDirectoryIfRequired(context as any, externalPath);

    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    expect(callArgs.always).toEqual(["/var/log/external/**"]);
  });

  it("includes empty metadata object", async () => {
    const context = createMockContext();
    const externalPath = "/var/log/external";

    await askExternalDirectoryIfRequired(context as any, externalPath);

    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    expect(callArgs.metadata).toEqual({});
  });
});

describe("execute_powershell external_directory permission integration", () => {
  it("requests external_directory permission when workdir is outside boundary", async () => {
    const context = createMockContext();
    const callOrder: string[] = [];

    // Wrap ask to track call order
    const originalAsk = context.ask;
    context.ask = mock(async (...args: any[]) => {
      const permission = args[0]?.permission;
      callOrder.push(permission);
      return originalAsk(...args);
    });

    await execute_powershell.execute(
      {
        command: "Get-Process",
        description: "List processes",
        workdir: "/var/log/external",
      },
      context as any
    );

    // Both permissions should be requested
    expect(context.ask).toHaveBeenCalledTimes(2);
    expect(callOrder).toEqual(["execute_powershell", "external_directory"]);
    
    // Verify external_directory permission payload
    const externalCall = (context.ask as any).mock.calls.find(
      (call: any) => call[0].permission === "external_directory"
    );
    expect(externalCall).toBeDefined();
    expect(externalCall[0].patterns[0]).toBe("/var/log/external/**");
  });

  it("does NOT request external_directory permission when workdir is inside boundary", async () => {
    const context = createMockContext();

    await execute_powershell.execute(
      {
        command: "Get-Process",
        description: "List processes",
        workdir: "./src/components",
      },
      context as any
    );

    // Only execute_powershell permission should be requested
    expect(context.ask).toHaveBeenCalledTimes(1);
    const callArgs = (context.ask as any).mock.calls[0][0];
    expect(callArgs.permission).toBe("execute_powershell");
  });

  it("requests external_directory for absolute path outside boundary", async () => {
    const context = createMockContext();

    await execute_powershell.execute(
      {
        command: "Get-ChildItem",
        description: "List files",
        workdir: "/etc/config",
      },
      context as any
    );

    expect(context.ask).toHaveBeenCalledTimes(2);
    
    const externalCall = (context.ask as any).mock.calls.find(
      (call: any) => call[0].permission === "external_directory"
    );
    expect(externalCall).toBeDefined();
    expect(externalCall[0].patterns[0]).toBe("/etc/config/**");
  });

  it("permission order: execute_powershell first, then external_directory", async () => {
    const context = createMockContext();
    const callOrder: string[] = [];

    context.ask = mock(async (...args: any[]) => {
      const permission = args[0]?.permission;
      callOrder.push(permission);
    });

    await execute_powershell.execute(
      {
        command: "Invoke-Command",
        description: "Run command",
        workdir: "/var/log",
      },
      context as any
    );

    expect(callOrder).toEqual(["execute_powershell", "external_directory"]);
  });

  it("glob pattern uses forward slashes even with backslash input", async () => {
    const context = createMockContext();
    // Use a Unix path with escaped backslashes that should be converted
    const pathWithBackslashes = "/var/log\\\\external\\\\test";

    await execute_powershell.execute(
      {
        command: "Get-Content",
        description: "Read file",
        workdir: pathWithBackslashes,
      },
      context as any
    );

    const externalCall = (context.ask as any).mock.calls.find(
      (call: any) => call[0].permission === "external_directory"
    );
    
    expect(externalCall).toBeDefined();
    const pattern = externalCall[0].patterns[0];
    // The glob pattern should convert backslashes to forward slashes
    expect(pattern).not.toContain("\\");
    expect(pattern).toContain("/");
    expect(pattern).toEndWith("/**");
  });

  it("handles exact boundary root (context.directory) without external permission", async () => {
    const context = createMockContext();

    await execute_powershell.execute(
      {
        command: "Get-Process",
        description: "List processes",
        workdir: "/home/user/project",
      },
      context as any
    );

    expect(context.ask).toHaveBeenCalledTimes(1);
    expect((context.ask as any).mock.calls[0][0].permission).toBe("execute_powershell");
  });

  it("handles exact boundary root (context.worktree) without external permission", async () => {
    const context = createMockContext();

    await execute_powershell.execute(
      {
        command: "Get-Process",
        description: "List processes",
        workdir: "/home/user/project/.worktrees/task-013",
      },
      context as any
    );

    expect(context.ask).toHaveBeenCalledTimes(1);
    expect((context.ask as any).mock.calls[0][0].permission).toBe("execute_powershell");
  });

  it("requests external_directory when command references external path", async () => {
    const context = createMockContext();

    await execute_powershell.execute(
      {
        command: "Get-Content -Path /var/log/system.log",
        description: "Read external file",
        workdir: ".",
      },
      context as any
    );

    expect(context.ask).toHaveBeenCalledTimes(2);

    const externalCall = (context.ask as any).mock.calls.find(
      (call: any) => call[0].permission === "external_directory"
    );
    expect(externalCall).toBeDefined();
    expect(externalCall[0].patterns).toContain("/var/log/**");
  });

  it("does not spawn process when external_directory is denied", async () => {
    const originalBunSpawn = Bun.spawn;
    let spawnCalled = false;

    (Bun as unknown as { spawn: typeof Bun.spawn }).spawn = ((...args: any[]) => {
      spawnCalled = true;
      return (originalBunSpawn as any)(...args);
    }) as any;

    try {
      const context = createMockContext({
        ask: mock(async (req: any) => {
          if (req.permission === "external_directory") {
            throw new Error("Denied external_directory");
          }
        }),
      });

      await expect(
        execute_powershell.execute(
          {
            command: "Get-Content -Path /var/log/system.log",
            description: "Read external file",
            workdir: ".",
          },
          context as any
        )
      ).rejects.toThrow("Denied external_directory");

      expect(spawnCalled).toBe(false);
    } finally {
      (Bun as unknown as { spawn: typeof Bun.spawn }).spawn = originalBunSpawn;
    }
  });
});
