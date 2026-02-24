# Task ID: task-022
# Task Name: Implement package exports and build output validation

## Context
This task is required to guarantee npm consumers and OpenCode plugin loading resolve the built entrypoint deterministically.

## Inputs
* `.docs/requirements/opencode-execute-powershell-plugin.md` sections: Plugin Loading
* `package.json`
* `tsconfig.json`

## Output / Definition of Done
* `package.json` defines exports for `.` to `./dist/index.js` and `./dist/index.d.ts`.
* Build script emits `dist/index.js` and declaration files.
* `test/package.exports.test.ts` imports build output and asserts `ExecutePowerShellPlugin` export.
* `README.md` documents plugin installation and registration entry in `opencode.json`.
* Automated test proves export contract for built artifacts.

## Step-by-Step Instructions
1. Update `package.json` exports map and build script to target `dist/` outputs.
2. Confirm TypeScript build path aligns with exports map.
3. Add `test/package.exports.test.ts` that imports compiled output and asserts named export presence.
4. Add `README.md` usage section that references plugin installation and config entry.
5. Ensure test fails before exports/build wiring and passes after exports/build wiring.

## Verification
* Command: `bun run build && bun test test/package.exports.test.ts`
* Expected result: build command exits with status `0` and test suite reports pass for `test/package.exports.test.ts`.
