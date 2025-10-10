# Solidity Event Faker
A tool to create fake contracts that only emits events based on subgraph definitions

## Frameworks used

- deno
- cliffy (for CLI argument parsing)
- anvil
- foundry
- viem
- vento

## What is it
It is a CLI that can perform multiple tasks. It reads its config from a file called sef.json

## Implementation Status: ✅ COMPLETED

The tasks are:
- **subgraph:add**: Use foundry CLI to instantiate a foundry project
  - Creates a new foundry project using `forge init`
  - Requires a `--subgraph` argument: path of the subgraph folder associated with the the foundry project. The task checks that it corresponds to a properly formatted YAML file
  - Validates subgraph.yaml structure including required fields (specVersion, dataSources, etc.)
  - Validates data source configuration including event handlers
  - Takes a `--name` argument: name of the folder containing the foundry project (defaults to foundry)
  - Creates or updates a `sef.json` registry file in the anvil-event-faker folder
  - Registry is a map indexed by project name containing subgraph path
- **subgraph:remove**: 
  - Removes a foundry project from registry and filesystem
  - Requires a `--name` argument: name of the project to remove
  - Supports `--force` flag to skip confirmation prompt
  - Removes project directory and all its files
  - Removes project entry from sef.json registry
  - Removes registry file if it becomes empty
- **contracts:generate**: 
  - Reads project configurations from `sef.json` registry
  - Iterates over all registered projects
  - Parses each project's `subgraph.yaml`
  - Extracts events from subgraph eventHandlers definitions
  - For each contract name creates an actual Solidity contract where there is one function per associated event
  - Each function has the same arguments as the events and its purpose is only to emit the associated event
  - Generates contracts in `./{projectName}/src/` directory


## Usage

```bash
# Initialize a project
deno task run subgraph:add --subgraph ../subgraph --name my-project

# Generate fake contracts
deno task run generate --name my-project

# Remove a project
deno task run subgraph:remove --name my-project

# Force remove without confirmation
deno task run subgraph:remove --name my-project --force
```

## Configuration

The tool uses a `sef.json` registry file in the anvil-event-faker folder:
```json
{
  "my-project": {
    "subgraph_path": "../subgraph"
  },
  "another-project": {
    "subgraph_path": "../other-subgraph"
  }
}
```

## Quality

No compile warnings - All code passes Deno linting without warnings
