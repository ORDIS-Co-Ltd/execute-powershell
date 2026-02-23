# OpenCode Execute PowerShell Plugin (SRS)

## Background

OpenCode's built-in `bash` tool executes commands through an OS shell selected by OpenCode. On Windows this selection falls back to `cmd.exe` (or Git Bash when available), which causes PowerShell-native commands to fail and makes tool use inconsistent for Windows-first workflows.

This feature will deliver an OpenCode plugin that registers a first-class `execute_powershell` tool so the LLM can reliably run PowerShell commands on Windows while still using OpenCode's permission system.

In scope:

- A plugin that registers `execute_powershell` and enforces OpenCode permissions for it.
- Windows-native PowerShell execution without requiring WSL.

Out of scope:

- Changes to OpenCode core.
- Fixing the built-in `bash` tool on Windows.
- Interactive PowerShell (prompt-driven) sessions.

## User Stories

- As a Windows developer, I want the agent to run PowerShell commands via a dedicated tool so that shell execution works without requiring WSL.
- As a security-conscious user, I want PowerShell execution to be governed by OpenCode permissions so that I stay in control of what the agent executes.
- As a plugin maintainer, I want the tool to have deterministic input/output behavior (exit codes, stdout, stderr, timeouts) so that agent reasoning over command results is reliable.

## Functional Requirements

### Plugin Loading

- The plugin must be loadable by OpenCode from local plugin directories and from npm via the `plugin` list in `opencode.json`.
- The plugin must export at least one plugin function that conforms to OpenCode's plugin module expectations and initializes without side effects beyond registering hooks and tools.

### Tool Registration

- The plugin must register a tool named `execute_powershell` through the plugin `tool` hook.
- The tool must be discoverable alongside built-in tools and must be invokable by the LLM during a session.

### Tool Arguments

- The `execute_powershell` tool must accept the following arguments:
- `command` (string) is required and must contain PowerShell code to execute.
- `description` (string) is required and must be a concise human-readable description of the command.
- `timeout_ms` (number) must be accepted and must default to `120000` when omitted.
- `timeout_ms` must be an integer.
- `timeout_ms` must be greater than or equal to `0`.
- `timeout_ms` equal to `0` must disable timeout-based termination.
- `workdir` (string) must be accepted and must default to `context.directory` when omitted.

### Tool Execution Semantics

- The tool must run PowerShell in non-interactive mode.
- The tool must not rely on OpenCode's `bash` tool or any POSIX shell.
- The tool must pass the PowerShell program text via standard input and must not pass user-supplied PowerShell code via the OS command line.
- The tool must select the PowerShell executable using the following precedence:
- `pwsh` from `PATH`.
- `powershell.exe` from `PATH`.
- The tool must fail with a clear error message when neither `pwsh` nor `powershell.exe` is available.

### Permission Enforcement

- The tool must request OpenCode permission via `context.ask()` before starting process execution.
- The permission key requested must be `execute_powershell`.
- The permission request must include:
- `patterns` containing the full `command` string.
- `always` containing a stable command prefix pattern derived from `command`.
- The command prefix derivation must follow these rules:
- The tool must split `command` into tokens using whitespace.
- The tool must skip leading tokens that equal `&` or `.`.
- The tool must use the first remaining token as the command prefix.
- The tool must set `always` to an array containing exactly one element of the form `<prefix> *`.
- The tool must request `external_directory` permission via `context.ask()` when `workdir` resolves outside the OpenCode project boundary.

### Project Boundary Rules

- The tool must treat `context.directory` as an allowed boundary root.
- The tool must treat `context.worktree` as an allowed boundary root when `context.worktree` is not `/`.
- The tool must normalize and resolve `workdir` to an absolute path prior to boundary evaluation.
- The tool must ask for `external_directory` permission using directory-glob patterns derived from the resolved `workdir`.

### Output Contract

- The tool must return a single string that includes:
- Combined `stdout` and `stderr` in execution order.
- A machine-readable footer that includes the PowerShell process exit code.
- The machine-readable footer must be wrapped in the following tags:
- `<powershell_metadata>` and `</powershell_metadata>`.
- The tool must preserve output bytes as text using UTF-8 decoding.
- The tool must truncate output at the OpenCode tool output truncation boundary only through OpenCode's existing truncation mechanism.

### Cancellation And Timeouts

- The tool must terminate the PowerShell process tree when `context.abort` is aborted.
- The tool must terminate the PowerShell process tree when `timeout_ms` elapses when `timeout_ms` is greater than `0`.
- The tool must return output that includes a machine-readable footer indicating whether the run ended by timeout or abort.

## Non-Functional Requirements

### Compatibility

- The plugin must support OpenCode CLI version `v1.2.10`.
- The plugin must support Windows 10 and Windows 11.

### Security

- The tool must execute PowerShell with `-NoProfile` and `-NonInteractive`.
- The tool must not read or write files outside the OpenCode working directory or worktree unless the user grants `external_directory` permission.

### Observability

- The tool must emit enough information in its returned output to support debugging failures without requiring additional tools.

## Technology Baseline

- OpenCode plugin system must be used as documented in OpenCode Plugins documentation (`/docs/plugins/`).
- OpenCode permissions system must be used through `context.ask()` to integrate with `permission` rules in `opencode.json`.
- The tool definition must conform to the runtime shape consumed by OpenCode `ToolRegistry.fromPlugin()`.
- Bun runtime APIs must be used for process execution. OpenCode repository baseline declares `packageManager: bun@1.3.9`.
- Zod must be used for tool argument schemas. OpenCode repository baseline declares `zod@4.1.8`.
- PowerShell CLI invocation semantics must follow Microsoft documentation for `powershell.exe` and `pwsh`, including non-interactive execution modes and `-EncodedCommand` UTF-16LE requirements.
