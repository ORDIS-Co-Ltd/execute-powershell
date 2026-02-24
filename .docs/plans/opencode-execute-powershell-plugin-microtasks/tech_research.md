# Technology Research

## Technology Inventory
* OpenCode plugin SDK: `@opencode-ai/plugin`
* OpenCode permissions model: `context.ask()` and `external_directory`
* Bun runtime and subprocess APIs
* Zod schema validation
* TypeScript compiler
* Bun type declarations: `@types/bun`
* PowerShell CLIs: `pwsh` and `powershell.exe`
* Windows termination utility: `taskkill`
* GitHub Actions: `actions/checkout` and `oven-sh/setup-bun`
* npm packaging validation through `npm pack --dry-run --json`

## Version Baseline
All versions in this section are required to match the verification sources listed in the Sources section.

### @opencode-ai/plugin
* Target version is required to be `1.2.10`.
* Validation source is `npm view @opencode-ai/plugin version`.
* The implementation is required to remain compatible with OpenCode CLI `v1.2.10`.

### Bun
* Target version is required to be `1.3.9`.
* Validation sources are Bun release records for `bun-v1.3.9` and Bun blog release notes.
* CI installation is required to pin Bun major line through `oven-sh/setup-bun@v2`.

### Zod
* Target version is required to be `4.3.6`.
* Validation source is `npm view zod version`.
* Required API usage will stay within stable `z.object`, `z.string`, `z.number().int().min(0)`, and `.default()` methods.

### TypeScript
* Target version is required to be `5.9.3`.
* Validation source is `npm view typescript version`.
* Build output is required to emit ESM JavaScript and declaration files.

### @types/bun
* Target version is required to be `1.3.9`.
* Validation source is `npm view @types/bun version`.

### GitHub Actions
* `actions/checkout` workflow usage is required to pin major `v6`.
* `actions/checkout` latest release at plan finalization is `v6.0.2`.
* `oven-sh/setup-bun` workflow usage is required to pin major `v2`.
* `oven-sh/setup-bun` latest release at plan finalization is `v2.1.2`.

## API Surface Notes
### OpenCode Plugin API
* Plugin functions must conform to `Plugin = (input: PluginInput) => Promise<Hooks>`.
* Tool registration must use the `tool` hook map in returned `Hooks`.
* `ToolContext.ask()` input is required to include `permission`, `patterns`, `always`, and `metadata`.
* Plugin loading is required to support npm package names in `opencode.json` and local plugin files in `.opencode/plugins/` and `~/.config/opencode/plugins/`.
* Plugin loading order is required to follow documented source precedence so local and npm plugins resolve deterministically.

### OpenCode Permission Rules
* Permission actions are required to resolve to `allow`, `ask`, or `deny`.
* Pattern matching is required to use wildcard semantics with `*` and `?`.
* `external_directory` is required for path access outside the project boundary.

### Bun Runtime
* `Bun.spawn()` options required by this plan include `cmd`, `cwd`, `stdin`, `stdout`, `stderr`, `signal`, and `windowsHide`.
* `Bun.which()` is required for executable resolution precedence.
* Bun test coverage gating is required to use `bun test --coverage` and `bunfig.toml` thresholds.

### Zod
* Schema definitions are required to use Zod primitive and numeric constraint APIs.
* Timeout validation is required to enforce integer and minimum boundary behavior.

### PowerShell CLI
* `pwsh` and `powershell.exe` command-line syntax is required to support `-Command -` for stdin program text.
* Security flags `-NoProfile` and `-NonInteractive` are required for process launch.
* This plan prohibits use of `-EncodedCommand` for user payload transport because stdin transport is mandated by SRS execution semantics.

### Windows Process Termination
* Process tree termination is required to invoke `taskkill /PID <pid> /T /F` on Windows.

## Compatibility And Deprecation Notes
* OpenCode permissions documentation states that the legacy `tools` boolean configuration is deprecated as of `v1.1.1`.
* This plan is required to integrate permissions only through `permission` rules and `context.ask()` calls.
* SRS baseline lists Zod `4.1.8`; npm stable version is `4.3.6`; selected APIs are required to stay inside shared stable surface, so migration risk is constrained.
* SRS execution semantics require stdin transport while SRS baseline notes include encoded-command guidance; this plan is required to prioritize stdin transport and verify encoded-command exclusion through automated tests.

## Sources
### Context7 Sources
* `context7_resolve-library-id` for `@opencode-ai/plugin` selected `/websites/opencode_ai_plugins`.
* `context7_query-docs` on `/websites/opencode_ai_plugins` validated plugin and tool registration shape.
* `context7_resolve-library-id` for Bun selected `/oven-sh/bun`.
* `context7_query-docs` on `/oven-sh/bun` validated `Bun.spawn()`, `Bun.which()`, and coverage threshold configuration.
* `context7_resolve-library-id` for Zod selected `/colinhacks/zod`.
* `context7_query-docs` on `/colinhacks/zod/v4.0.1` validated `.int()`, `.min()`, and `.default()` behavior.
* `context7_resolve-library-id` for TypeScript selected `/microsoft/typescript`.
* `context7_query-docs` on `/microsoft/typescript/v5.9.3` validated ESM/declaration compiler configuration patterns.
* `context7_resolve-library-id` for setup-bun selected `/oven-sh/setup-bun`.
* `context7_query-docs` on `/oven-sh/setup-bun` validated action syntax and inputs.
* `context7_resolve-library-id` for OpenCode repository selected `/anomalyco/opencode`.
* `context7_query-docs` on `/anomalyco/opencode` validated permissions deprecation, `external_directory` behavior, plugin local-directory loading, and npm plugin loading via `opencode.json`.

### Supplemental Validation Sources
* `npm view @opencode-ai/plugin version`
* `npm view zod version`
* `npm view typescript version`
* `npm view @types/bun version`
* `https://github.com/oven-sh/bun/releases` (latest `bun-v1.3.9`)
* `https://bun.com/blog/bun-v1.3.9`
* `https://github.com/actions/checkout/releases` (latest `v6.0.2`)
* `https://github.com/oven-sh/setup-bun/releases` (latest `v2.1.2`)
* `https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_pwsh?view=powershell-7.4`
* `https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_powershell_exe?view=powershell-5.1`
* `https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/taskkill`
* `https://opencode.ai/docs/plugins/`
* `https://unpkg.com/@opencode-ai/plugin@1.2.10/dist/index.d.ts`
* `https://unpkg.com/@opencode-ai/plugin@1.2.10/dist/tool.d.ts`
