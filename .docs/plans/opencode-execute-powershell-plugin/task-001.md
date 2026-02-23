# Task ID: task-001
# Task Name: Scaffold Plugin Package And Tooling

## Context
This task is required to create the repository structure that the plugin implementation will use, including build and test tooling required for automated verification.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md`
* OpenCode Plugins docs (`https://opencode.ai/docs/plugins/`)
* Bun test coverage docs (`/oven-sh/bun` Context7)

## Output / Definition of Done
* `package.json` is created with dependencies required for implementation.
* `tsconfig.json` is created for TypeScript compilation.
* `bunfig.toml` is created and enforces `coverageThreshold` at `1.0`.
* `src/` and `test/` directories are created.
* A baseline test file is added and `bun test --coverage` runs.

## Step-by-Step Instructions
1. Create `package.json` with:
   1. `name`, `version`, `type: "module"`, and `exports` for ESM.
   2. `dependencies` including `@opencode-ai/plugin@1.2.10` and `zod@4.3.6`.
   3. `devDependencies` including `typescript@5.9.3` and `@types/bun@1.3.9`.
   4. `scripts` including `test`, `test:coverage`, and `build`.
2. Create `tsconfig.json` that targets Bun runtime usage and emits ESM output into `dist/`.
3. Create `bunfig.toml` with `[test] coverageThreshold = { lines = 1.0, functions = 1.0, statements = 1.0 }`.
4. Create `src/index.ts` as an empty module placeholder that exports a symbol to keep the build green.
5. Create `test/smoke.test.ts` that imports `src/index.ts` and asserts a trivial invariant.

## Verification
* `bun install`
* `bun test --coverage`
* `bun run build`
