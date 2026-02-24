# Review Report: task-018 (/ Implement metadata footer assembly)

## Status
**FAIL**
*(Note: Use PASS only if the code is perfect, secure, matches the plan, and tests pass.)*

## Compliance Check
- [ ] Implementation matches `task-[id].md` instructions.
- [ ] Definition of Done met.
- [ ] No unauthorized architectural changes.

## Verification Output
*   **Command Run:** `bun test test/execute_powershell.metadata.footer.test.ts`
*   **Result:** Pass. Exit status `0`; suite reports `15 pass`, `0 fail`.
*   **Command Run:** `bun test`
*   **Result:** Fail. Exit status non-zero; full suite reports `196 pass`, `5 fail` (`test/execute_powershell.permission.ask.test.ts`, `test/execute_powershell.registration.test.ts`, `test/execute_powershell.schema.workdir.test.ts`).
*   **Command Run:** `bun -e 'import { parseMetadataFooter } from "./src/tools/metadata.ts"; const text = "x<powershell_metadata>{\"exitCode\":0}</powershell_metadata>"; console.log(JSON.stringify(parseMetadataFooter(text)));'`
*   **Result:** Fail. Parser accepts malformed metadata and returns `{"exitCode":0}` instead of rejecting missing required fields.
*   **Command Run:** `bun -e 'import { parseMetadataFooter } from "./src/tools/metadata.ts"; const text = "prefix <powershell_metadata>{\"foo\":1}</powershell_metadata> mid <powershell_metadata>{\"exitCode\":0,\"endedBy\":\"exit\",\"shell\":\"pwsh\",\"resolvedWorkdir\":\"/w\",\"timeoutMs\":1,\"durationMs\":2}</powershell_metadata>"; console.log(parseMetadataFooter(text));'`
*   **Result:** Fail. Parser returns `null` when output contains an earlier metadata-like tag before the real trailing footer.

## Issues Found (If FAIL)
*   **Critical:** `parseMetadataFooter` does not validate required fields/types and accepts incomplete payloads; this violates the required-footer-field contract.
*   **Major:** `parseMetadataFooter` can fail to parse the real trailing footer when command output contains earlier `<powershell_metadata>...</powershell_metadata>` content, breaking parseability under malicious/untrusted output.
*   **Major:** Repository regression introduced by `src/tools/execute_powershell.ts` behavior change causes existing automated tests to fail (`bun test` has 5 failing tests).
*   **Minor:** Error classification in `src/tools/execute_powershell.ts` marks generic execution errors as `endedBy: "abort"`, reducing metadata accuracy for observability.

## Required Actions
1. Enforce strict runtime validation in `parseMetadataFooter` for all required fields (`exitCode`, `endedBy`, `shell`, `resolvedWorkdir`, `timeoutMs`, `durationMs`) and return `null` when any are missing or invalid.
2. Update footer extraction logic to reliably parse only the final metadata footer and remain robust when earlier footer-like tags appear in command output.
3. Ensure `execute_powershell` always emits all required metadata fields in every path (including when arguments are invoked without prior schema parsing in tests).
4. Fix unit/integration tests or execution wiring so the full suite passes (`bun test`) without relying on local PowerShell availability in unrelated tests.
5. Refine `endedBy` classification so non-timeout/non-user-abort execution errors are not mislabeled as `abort`.
