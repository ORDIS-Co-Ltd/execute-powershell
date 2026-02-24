# OpenCode Execute PowerShell Plugin - Microtask Implementation Plan

## Source Of Truth
* This plan is required to implement `.docs/requirements/opencode-execute-powershell-plugin.md`.
* This plan is required to implement an OpenCode plugin that registers `execute_powershell` for OpenCode CLI `v1.2.10`.

## Architecture Decision Record (ADR)
### ADR-001: Plugin Module Contract
* The plugin package will export one named plugin function: `ExecutePowerShellPlugin`.
* `ExecutePowerShellPlugin` must initialize without import-time side effects.
* `ExecutePowerShellPlugin` will register tools through the `tool` hook by returning `{ tool: { execute_powershell } }`.

### ADR-002: Secure PowerShell Invocation
* The tool must execute PowerShell through `Bun.spawn()`.
* Executable resolution must use deterministic precedence: `pwsh` first, then `powershell.exe`.
* The process command line must contain `-NoProfile`, `-NonInteractive`, `-Command`, and `-`.
* User-supplied PowerShell program text must travel through stdin only.

### ADR-003: Permission And Boundary Enforcement
* The tool must call `context.ask()` with permission key `execute_powershell` before process creation.
* The permission payload must include `patterns: [command]` and `always` with exactly one derived prefix pattern.
* `workdir` must resolve to an absolute path before boundary evaluation.
* Allowed boundary roots must include `context.directory` and `context.worktree` when `context.worktree` is not `/`.
* The tool must request `external_directory` before execution when `workdir` resolves outside all boundary roots.

### ADR-004: Output And Metadata Contract
* The tool must return one string containing combined `stdout` and `stderr` content in observed arrival order.
* The tool must append a machine-readable JSON footer wrapped in `<powershell_metadata>` tags.
* Footer fields must include `exitCode`, `endedBy`, `shell`, `resolvedWorkdir`, `timeoutMs`, and `durationMs`.
* UTF-8 decoding must handle all process output bytes.

### ADR-005: Termination Semantics
* Abort and timeout paths must terminate the PowerShell process tree.
* Windows process tree termination must use `taskkill /PID <pid> /T /F`.
* Metadata must report `endedBy` as `exit`, `timeout`, or `abort`.

## Target Files
The implementation is required to touch the following files.

### Package And Tooling
* `package.json`
* `tsconfig.json`
* `bunfig.toml`
* `README.md`
* `LICENSE`

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
* `test/package.manifest.test.ts`
* `test/tsconfig.build.test.ts`
* `test/bunfig.coverage.test.ts`
* `test/smoke.test.ts`
* `test/execute_powershell.plugin-export.test.ts`
* `test/execute_powershell.registration.test.ts`
* `test/execute_powershell.schema.timeout.test.ts`
* `test/execute_powershell.schema.workdir.test.ts`
* `test/execute_powershell.permission.prefix.test.ts`
* `test/execute_powershell.permission.ask.test.ts`
* `test/execute_powershell.workdir.resolve.test.ts`
* `test/execute_powershell.workdir.boundary.test.ts`
* `test/execute_powershell.workdir.permission.test.ts`
* `test/execute_powershell.executable.resolve.test.ts`
* `test/execute_powershell.process.argv.test.ts`
* `test/execute_powershell.process.spawn.test.ts`
* `test/execute_powershell.output.collector.test.ts`
* `test/execute_powershell.metadata.footer.test.ts`
* `test/execute_powershell.timeout.abort.test.ts`
* `test/execute_powershell.termination.test.ts`
* `test/execute_powershell.integration.windows.test.ts`
* `test/package.exports.test.ts`
* `test/package.check.test.ts`
* `test/ci.workflow.test.ts`

### Release Automation
* `.github/workflows/ci.yml`

## Verification Strategy (100% Automated Coverage)
### Requirement To Test Mapping
* Plugin loading requirements must map to `test/execute_powershell.plugin-export.test.ts`, `test/package.exports.test.ts`, and `test/package.manifest.test.ts`.
* Tool registration requirements must map to `test/execute_powershell.registration.test.ts`.
* Tool argument requirements must map to `test/execute_powershell.schema.timeout.test.ts` and `test/execute_powershell.schema.workdir.test.ts`.
* Permission prefix and ask-order requirements must map to `test/execute_powershell.permission.prefix.test.ts` and `test/execute_powershell.permission.ask.test.ts`.
* Project boundary and external directory requirements must map to `test/execute_powershell.workdir.resolve.test.ts`, `test/execute_powershell.workdir.boundary.test.ts`, and `test/execute_powershell.workdir.permission.test.ts`.
* Executable precedence and command-line safety requirements must map to `test/execute_powershell.executable.resolve.test.ts`, `test/execute_powershell.process.argv.test.ts`, and `test/execute_powershell.process.spawn.test.ts`.
* Output contract requirements must map to `test/execute_powershell.output.collector.test.ts` and `test/execute_powershell.metadata.footer.test.ts`.
* Timeout and abort requirements must map to `test/execute_powershell.timeout.abort.test.ts`, `test/execute_powershell.termination.test.ts`, and `test/execute_powershell.integration.windows.test.ts`.
* Compatibility and release requirements must map to `test/package.check.test.ts` and `test/ci.workflow.test.ts`.

### Coverage Gates
* `bunfig.toml` will enforce `coverageThreshold = 1.0`.
* `bun test --coverage` must pass with full line and function coverage for implemented files.
* Runtime behavior tasks must include test cases that fail before implementation and pass after implementation.

## Scope Guardrails
* This plan must not modify OpenCode core source.
* This plan must not modify the built-in `bash` tool.
* This plan must not add interactive PowerShell session behavior.
* This plan must not require WSL.

## Risks / Unknowns
* Combined ordering from distinct output pipes is subject to OS scheduling and must be validated with stream-level tests.
* Windows process tree termination behavior differs across host policies and must be validated on Windows 10 and Windows 11 CI runners.
* Encoding behavior from localized PowerShell hosts must be validated with UTF-8 sample output in automated tests.
