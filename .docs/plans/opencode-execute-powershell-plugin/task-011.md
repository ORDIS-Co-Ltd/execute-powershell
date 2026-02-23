# Task ID: task-011
# Task Name: Implement Build Outputs And npm Packaging Validation

## Context
This task is required to ensure the plugin is loadable from npm by OpenCode and that the published package contains the correct ESM entrypoints.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` section:
  * Plugin Loading
* OpenCode plugin loader behavior (`packages/opencode/src/plugin/index.ts` in OpenCode upstream)

## Output / Definition of Done
* `package.json` exports map is configured so OpenCode will import the package entrypoint.
* `dist/` build output is produced by `bun run build` and contains compiled JavaScript.
* A packaging validation script is added:
  * `bun run package:check` runs `npm pack --dry-run` and asserts required files are included.
* `test/package.exports.test.ts` validates that importing the built `dist` entrypoint exports `ExecutePowerShellPlugin`.

## Step-by-Step Instructions
1. Configure `package.json`:
   1. Set `exports` to map `"."` to `./dist/index.js` and types to `./dist/index.d.ts`.
   2. Ensure the output is ESM.
2. Implement `bun run build` using `bun build` to emit `dist/index.js`.
3. Add a packaging validation script that executes `npm pack --dry-run --json` and checks for:
   * `dist/index.js`
   * `dist/index.d.ts`
   * `package.json`
4. Add a test that imports from the built output path.

## Verification
* `bun run build`
* `bun test --coverage`
* `bun run package:check`
