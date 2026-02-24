# Execute PowerShell Plugin

An OpenCode plugin that provides PowerShell script execution capabilities with built-in safety controls and permission management.

## Installation

```bash
bun install @ordis_co_th/execute-powershell
```

## Usage

### Register in `opencode.json`

Add the plugin to your OpenCode configuration. OpenCode expects the `plugin` key (singular) with a string array:

```json
{
  "plugin": [
    "@ordis_co_th/execute-powershell@1.0.3"
  ]
}
```

### Tool

Once registered, the plugin provides one tool: `execute_powershell`.

- Required params: `command`, `description`
- Optional params: `timeout_ms`, `workdir`
- `timeout_ms` default: `120000` (2 minutes)
- `workdir` default: current OpenCode directory (`context.directory`)

### Example Tool Call

```json
{
  "tool": "execute_powershell",
  "params": {
    "command": "Get-Process",
    "workdir": "/path/to/workdir",
    "timeout_ms": 30000
  }
}
```

### Permission Integration (`ask` / `allow` / `deny`)

This plugin uses OpenCode's native permission engine and asks for permission key `execute_powershell` before spawning any command.

```json
{
  "permission": {
    "execute_powershell": {
      "*": "ask",
      "Get-Process*": "allow",
      "Get-ChildItem*": "allow",
      "Invoke-Expression*": "deny",
      "Remove-Item*": "deny"
    }
  }
}
```

OpenCode evaluates rules with "last matching rule wins", so put broad defaults first and specific overrides later.

### External Directory Permission

If `workdir` resolves outside the active project/worktree boundary, the tool asks for OpenCode permission key `external_directory` using a recursive glob pattern.

```json
{
  "permission": {
    "execute_powershell": "ask",
    "external_directory": "ask"
  }
}
```

### Output Metadata Footer

Tool output includes a metadata footer:

`<powershell_metadata>{...}</powershell_metadata>`

Metadata fields:
- `exitCode`
- `endedBy` (`exit`, `timeout`, or `abort`)
- `shell` (`pwsh`, `powershell`, or `unknown`)
- `resolvedWorkdir`
- `timeoutMs`
- `durationMs`

### Platform and Security Notes

- Intended for Windows PowerShell command execution.
- Permission checks run before execution.
- For safer defaults, deny high-risk command patterns such as `Invoke-Expression*` and `Remove-Item*`.

## Development

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Run tests
bun test

# Check package contents
bun run package:check
```

## Package Structure

- **Entry Point**: `./dist/index.js`
- **Type Definitions**: `./dist/index.d.ts`
- **Export**: `ExecutePowerShellPlugin` - Main plugin function

## License

MIT
