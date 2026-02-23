# OpenCode Execute PowerShell Plugin - Implementation Plan

## Source Of Truth
* This plan is required to implement `.docs/requirements/opencode-execute-powershell-plugin.md`.
* This plan is required to implement a plugin that registers an `execute_powershell` tool for OpenCode CLI `v1.2.10`.

## Architecture Decision Record (ADR)
### ADR-001: Plugin Packaging And Export Shape
* The deliverable will be an npm package that OpenCode installs and imports.
* The package entrypoint is required to export exactly one plugin function as a named export (`ExecutePowerShellPlugin`).
* The plugin function is required to initialize without side effects beyond returning hook definitions.
* The plugin is required to register tools through the `tool` hook by returning `{ tool: { execute_powershell: ToolDefinition } }`.

### ADR-002: PowerShell Invocation Contract
* The tool is required to execute PowerShell through `Bun.spawn()`.
* The tool is required to select the executable with precedence: `pwsh` from `PATH`, then `powershell.exe` from `PATH`.
* The tool is required to execute in non-interactive mode with `-NoProfile` and `-NonInteractive`.
* The tool is required to pass user-supplied PowerShell program text via standard input.
* The tool is required to pass a constant command-line program selector (for example `-Command -`) and is required to never embed user-supplied PowerShell program text into the OS command line.

### ADR-003: Permissions And Boundary Enforcement
* The tool is required to request OpenCode permission via `context.ask()` before process creation.
* The tool is required to request permission key `execute_powershell` with:
  * `patterns` containing the full `command` string.
  * `always` containing exactly one element derived from the command prefix rules in the SRS.
* The tool is required to normalize and resolve `workdir` to an absolute path before boundary evaluation.
* The tool is required to treat `context.directory` as an allowed boundary root.
* The tool is required to treat `context.worktree` as an allowed boundary root when `context.worktree` is not `/`.
* The tool is required to request `external_directory` permission via `context.ask()` when `workdir` resolves outside all allowed boundary roots.
* The `external_directory` permission request is required to use directory-glob patterns derived from the resolved `workdir` and is required to normalize path separators to `/`.

### ADR-004: Output Contract And Metadata Footer
* The tool is required to return a single string consisting of:
  * combined `stdout` and `stderr` text in execution order
  * a machine-readable footer wrapped in `<powershell_metadata>` and `</powershell_metadata>` tags
* The metadata footer is required to be JSON and is required to include:
  * `exitCode` (number)
  * `endedBy` with values `"exit" | "timeout" | "abort"`
  * `shell` with values `"pwsh" | "powershell.exe"`
  * `resolvedWorkdir` (string)
  * `timeoutMs` (number)
  * `durationMs` (number)
* Output decoding is required to use UTF-8.
* Output truncation is required to be performed only by OpenCode’s tool truncation mechanism.

### ADR-005: Cancellation, Timeouts, And Process Tree Termination
* The tool is required to terminate the PowerShell process tree on `context.abort` abort.
* The tool is required to terminate the PowerShell process tree on timeout when `timeout_ms > 0`.
* On Windows, process tree termination is required to use `taskkill /PID <pid> /T /F`.
* The tool is required to return a metadata footer that indicates timeout and abort outcomes.

## Target Files
The implementation is required to touch the following files.

### Package And Build
* `package.json`
* `bunfig.toml`
* `tsconfig.json`
* `README.md`
* `LICENSE`
* `.github/workflows/ci.yml`

### Plugin Source
* `src/index.ts`
* `src/tools/execute_powershell.ts`
* `src/tools/permissions.ts`
* `src/tools/workdir.ts`
* `src/tools/powershell_exe.ts`
* `src/tools/process.ts`
* `src/tools/output.ts`
* `src/tools/metadata.ts`

### Tests
* `test/execute_powershell.schema.test.ts`
* `test/execute_powershell.permissions.test.ts`
* `test/execute_powershell.workdir.test.ts`
* `test/execute_powershell.executable.test.ts`
* `test/execute_powershell.spawn.unit.test.ts`
* `test/execute_powershell.integration.windows.test.ts`

## Verification Strategy (100% Automated Coverage)
### Requirement To Test Mapping
* Plugin loading requirements are required to be covered by unit tests that import the package entrypoint and validate exported plugin functions and hook shapes.
* Tool registration requirements are required to be covered by unit tests that call the plugin function and assert that `execute_powershell` is present with a valid ToolDefinition shape.
* Argument validation requirements are required to be covered by unit tests that parse tool args and assert defaults, integer constraints, and boundary values.
* Permission enforcement requirements are required to be covered by unit tests that mock `context.ask()` and assert:
  * permission keys
  * `patterns` content
  * `always` prefix derivation
  * ordering relative to process spawn
* Project boundary requirements are required to be covered by unit tests that evaluate `workdir` resolution for:
  * relative paths
  * absolute paths
  * `context.worktree === "/"` behavior
  * Windows path separator normalization to `/` in permission patterns
* Execution semantics are required to be covered by unit tests that validate:
  * executable resolution precedence
  * spawn argv invariants that prevent embedding user code on the OS command line
* Output contract requirements are required to be covered by unit tests that:
  * synthesize interleaved stdout/stderr chunks
  * assert combined output ordering
  * parse and assert the metadata footer
* Timeout and abort requirements are required to be covered by:
  * unit tests that simulate abort and timeout control flow and assert that termination helpers are called
  * Windows integration tests that execute `pwsh` and `powershell.exe` on a Windows CI runner and assert non-interactive, stdin-driven execution

### Commands
* The repository is required to provide `bun test --coverage` and is required to fail when coverage is less than 1.0 for lines, functions, and statements.
* The CI workflow is required to run tests on Windows.

## Scope Guardrails
* This plan is required to not change OpenCode core.
* This plan is required to not modify the built-in `bash` tool.
* This plan is required to not implement interactive PowerShell sessions.
* This plan is required to not require WSL.

## Risks / Unknowns
* Process tree termination semantics vary across platforms and are required to be validated on Windows 10 and Windows 11 during implementation.
* Combined stdout/stderr ordering across separate OS pipes is not guaranteed by the OS and is required to be validated using an interleaving test harness.
* PowerShell output encoding depends on host settings and is required to be validated against UTF-8 decoding behavior using non-ASCII output samples.
