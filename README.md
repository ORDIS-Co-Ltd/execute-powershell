# Execute PowerShell Plugin

An OpenCode plugin that provides PowerShell script execution capabilities with built-in safety controls and permission management.

## Installation

```bash
bun install execute-powershell
```

## Usage

### Register in `opencode.json`

Add the plugin to your OpenCode configuration:

```json
{
  "plugins": [
    "execute-powershell"
  ]
}
```

Or with explicit import path:

```json
{
  "plugins": [
    {
      "import": "execute-powershell",
      "config": {}
    }
  ]
}
```

### Available Tools

Once registered, the plugin provides the `execute_powershell` tool with the following features:

- **Command Execution**: Execute PowerShell scripts with proper output capture
- **Permission Controls**: Built-in safety mechanisms for command validation
- **Working Directory**: Configurable working directory for script execution
- **Timeout Support**: Configurable execution timeouts
- **Output Streaming**: Real-time stdout/stderr capture

### Example Tool Call

```json
{
  "tool": "execute_powershell",
  "params": {
    "command": "Get-Process",
    "workingDirectory": "/path/to/workdir",
    "timeout": 30000
  }
}
```

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
