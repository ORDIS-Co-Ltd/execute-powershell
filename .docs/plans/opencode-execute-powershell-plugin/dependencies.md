# Dependency Graph

## Phase 1: Foundation (Must complete first)
- [ ] `task-001`: Scaffold Plugin Package And Tooling
- [ ] `task-002`: Implement Plugin Entrypoint And Tool Registration

## Phase 2: Permissions And Path Safety (Blocked by Phase 1)
- [ ] `task-003`: Implement Tool Argument Schema And Defaults (Depends on: `task-001`, `task-002`)
- [ ] `task-004`: Implement Permission Ask And Command Prefix Derivation (Depends on: `task-003`)
- [ ] `task-005`: Implement Workdir Resolution And external_directory Permission (Depends on: `task-003`)

## Phase 3: Execution Core (Blocked by Phase 2)
- [ ] `task-006`: Implement PowerShell Executable Resolution (Depends on: `task-004`, `task-005`)
- [ ] `task-007`: Implement Non-Interactive Spawn With Stdin-Only Script Transport (Depends on: `task-006`)
- [ ] `task-008`: Implement Output Capture And Metadata Footer (Depends on: `task-007`)

## Phase 4: Cancellation, Timeouts, And Windows Semantics (Blocked by Phase 3)
- [ ] `task-009`: Implement Abort, Timeout, And Process Tree Termination (Depends on: `task-008`)
- [ ] `task-010`: Add Windows Integration Tests For pwsh And powershell.exe (Depends on: `task-009`)

## Phase 5: Packaging And CI (Blocked by Phase 4)
- [ ] `task-011`: Implement Build Outputs And npm Packaging Validation (Depends on: `task-010`)
- [ ] `task-012`: Add CI Workflow With Coverage Gate And Windows Runner (Depends on: `task-011`)
