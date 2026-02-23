# Technology Research

## Technology Inventory
* OpenCode plugin API: `@opencode-ai/plugin`
* OpenCode permissions model: `context.ask()` patterns and `external_directory`
* Runtime and process execution: Bun
* Argument schemas: Zod
* TypeScript compiler: `typescript`
* Bun TypeScript types: `@types/bun`
* PowerShell CLIs: `pwsh` and `powershell.exe`
* Windows process tree termination: `taskkill.exe`
* CI runners: GitHub Actions (`actions/checkout`, `oven-sh/setup-bun`)
* Packaging tooling: npm CLI (`npm pack`)

## Version Baseline (Must use current stable versions)
### @opencode-ai/plugin
* Target version is required to be `1.2.10`.
* Source is required to be npm registry (`npm view @opencode-ai/plugin version`).
* Compatibility constraint is required to be OpenCode CLI `v1.2.10`.

### Zod
* Target version is required to be `4.3.6`.
* Source is required to be npm registry (`npm view zod version`).
* API surface is required to include: `z.object`, `z.string`, `z.number().int().min()`, and `.default()`.

### TypeScript
* Target version is required to be `5.9.3`.
* Source is required to be npm registry (`npm view typescript version`).

### @types/bun
* Target version is required to be `1.3.9`.
* Source is required to be npm registry (`npm view @types/bun version`).

### Bun
* Target version for development and CI is required to be `1.3.9`.
* Source is required to be Bun GitHub releases (`oven-sh/bun` tag `bun-v1.3.9`).
* API surface is required to include:
  * `Bun.spawn()` with `cmd`, `cwd`, `stdin`, `stdout`, `stderr`, `signal`
  * `Bun.which()`
  * Bun test runner coverage features (`bun test --coverage` and `bunfig.toml` coverage thresholds)

### PowerShell
* The tool is required to support both:
  * PowerShell 7+ (`pwsh`)
  * Windows PowerShell 5.1 (`powershell.exe`)
* Source is required to be Microsoft Learn:
  * `about_Pwsh` documents `-Command -` and `-File -` stdin execution.
  * `about_PowerShell_exe` documents `-Command -` and `-File -` stdin execution.

### Windows taskkill
* Source is required to be Microsoft Learn `taskkill` reference.
* Required invocation is `taskkill /PID <pid> /T /F`.

### GitHub Actions
* `actions/checkout` is required to use major version `v6`.
* `oven-sh/setup-bun` is required to use major version `v2`.
* `oven-sh/setup-bun` stable release is required to be `v2.1.2` at plan finalization time.
* Sources are required to be GitHub releases and marketplace pages.

## API Surface Notes (Implementation Dependencies)
### OpenCode ToolContext.ask()
* `context.ask()` input is required to include: `permission`, `patterns`, `always`, `metadata`.
* Source is required to be `@opencode-ai/plugin@1.2.10` `dist/tool.d.ts`.

### Permission Patterns
* Permission patterns are required to use simple wildcard matching.
* `external_directory` patterns are required to support `**` and home expansion in config.
* Source is required to be OpenCode Permissions docs (`https://opencode.ai/docs/permissions/`).

### Bun Subprocess Cancellation
* `Bun.spawn()` is required to accept an `AbortSignal` to terminate a subprocess.
* `Bun.spawn()` is required to support a `timeout` option.
* Source is required to be Bun child-process documentation.

## Compatibility / Deprecation Notes
* OpenCode Permissions docs state that legacy `tools` boolean config is deprecated as of OpenCode `v1.1.1`.
* This plugin is required to integrate only through `context.ask()` and OpenCode permissions keys.

## Sources
* OpenCode Plugins documentation: `https://opencode.ai/docs/plugins/`
* OpenCode Permissions documentation: `https://opencode.ai/docs/permissions/`
* OpenCode plugin runtime types: `https://unpkg.com/@opencode-ai/plugin@1.2.10/dist/tool.d.ts`
* Bun child process docs (Context7): `/oven-sh/bun` query `Bun.spawn` and `AbortSignal`
* Bun executable resolution (Context7): `/oven-sh/bun` query `Bun.which`
* Zod docs (Context7): `/colinhacks/zod` query `z.int`, `.default`, `.min`
* PowerShell CLI docs:
  * `https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_pwsh?view=powershell-7.4`
  * `https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1`
* taskkill docs: `https://learn.microsoft.com/windows-server/administration/windows-commands/taskkill`
* TypeScript npm metadata: `npm view typescript version`
* @types/bun npm metadata: `npm view @types/bun version`
* GitHub Actions:
  * `https://github.com/actions/checkout/releases`
  * `https://github.com/oven-sh/setup-bun/releases`
  * `https://github.com/marketplace/actions/setup-bun`
