# Dependency Graph

## Phase 1: Foundation (Must complete first)
- [ ] `task-001`: Define package manifest baseline
- [ ] `task-002`: Define TypeScript build configuration (Depends on: `task-001`)
- [ ] `task-003`: Define Bun coverage gate configuration (Depends on: `task-001`)
- [ ] `task-004`: Create source and test scaffolding baseline (Depends on: `task-002`, `task-003`)

## Phase 2: Plugin Contract (Blocked by Phase 1)
- [ ] `task-005`: Implement plugin export contract (Depends on: `task-004`)
- [ ] `task-006`: Implement tool registration contract (Depends on: `task-005`)
- [ ] `task-007`: Implement timeout argument schema rules (Depends on: `task-006`)
- [x] `task-008`: Implement workdir argument default behavior (Depends on: `task-007`)
- [x] `task-009`: Implement command prefix derivation utility (Depends on: `task-007`)
- [x] `task-010`: Wire execute permission request flow (Depends on: `task-008`, `task-009`)

## Phase 3: Path Safety (Blocked by Phase 2)
- [x] `task-011`: Implement absolute workdir resolution (Depends on: `task-008`)
- [ ] `task-012`: Implement boundary root evaluation (Depends on: `task-011`)
- [ ] `task-013`: Wire external_directory permission request flow (Depends on: `task-010`, `task-012`)

## Phase 4: Execution Core (Blocked by Phase 3)
- [ ] `task-014`: Implement PowerShell executable resolver (Depends on: `task-013`)
- [ ] `task-015`: Implement spawn command argv invariants (Depends on: `task-014`)
- [ ] `task-016`: Implement spawn wrapper with stdin transport (Depends on: `task-015`)
- [ ] `task-017`: Implement combined output collector (Depends on: `task-016`)
- [ ] `task-018`: Implement metadata footer assembly (Depends on: `task-017`)

## Phase 5: Lifecycle Controls (Blocked by Phase 4)
- [ ] `task-019`: Implement timeout and abort coordination (Depends on: `task-018`)
- [ ] `task-020`: Implement process tree termination behavior (Depends on: `task-019`)
- [ ] `task-021`: Add Windows integration execution tests (Depends on: `task-020`)

## Phase 6: Packaging And CI (Blocked by Phase 5)
- [ ] `task-022`: Implement package exports and build output validation (Depends on: `task-021`)
- [ ] `task-023`: Implement npm pack dry-run artifact validation (Depends on: `task-022`)
- [ ] `task-024`: Implement CI workflow gates on Windows (Depends on: `task-023`)

## Phase 7: SRS Coverage Closures (Blocked by listed dependencies)
- [x] `task-025`: Add local plugin-directory loading verification (Depends on: `task-022`)
- [x] `task-026`: Add tool discovery and session invokability verification (Depends on: `task-022`)
- [x] `task-027`: Add output truncation-boundary non-interference verification (Depends on: `task-018`)
- [x] `task-028`: Add Windows 10 and Windows 11 compatibility workflow matrix (Depends on: `task-024`)
- [x] `task-029`: Add execution-mode compliance verification for -Command stdin path (Depends on: `task-016`)
