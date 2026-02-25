# Changelog

All notable changes to `@ordis_co_th/execute-powershell` are documented in this file.

## [Unreleased]

- No changes yet.

## [1.0.4]

### Added
- OpenCode-style output truncation for `execute_powershell` (`2000` lines / `50 KiB`) with full output persisted to OpenCode's `tool-output` directory.
- Metadata support for truncation details: `truncated` and `outputPath`.
- Best-effort command path scanning for common filesystem PowerShell commands to enforce `external_directory` checks beyond `workdir`.

### Changed
- Expanded README documentation for permission behavior and truncation semantics.
- Added test coverage for command path extraction, external directory denial behavior, and truncation edge cases.

## [1.0.3]

### Changed
- Updated documentation to describe OpenCode config usage (`plugin` key), permission integration (`ask`/`allow`/`deny`), and security guidance.

## [1.0.2]

### Fixed
- Added package `main` entry (`./dist/index.js`) to support OpenCode npm plugin loading when importing by package directory.

### Added
- Regression test for package directory import behavior.

## [1.0.1]

### Changed
- Updated package scope and documentation references to `@ordis_co_th/execute-powershell`.

## [1.0.0]

### Added
- Initial public release of the `execute_powershell` OpenCode plugin.
- Command execution with timeout handling, workdir support, and metadata footer output.
- Permission integration using `execute_powershell` and `external_directory` checks.
