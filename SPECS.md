# Graph Node State Manager

A CLI to generate and deploy fake contracts that emit events based on subgraph definitions, and to manage a local graph-node stack.

## Frameworks used

- deno
- cliffy (for CLI argument parsing)
- anvil
- foundry
- vento

## What is it
It is a CLI that can perform multiple tasks. It reads its config from a file called `config.json`.

## Implementation Status: ✅ COMPLETED

The tasks are:
- `subgraph:add <path> [-n <name>]`
  - Creates a new foundry project using `forge init`
  - Requires a `--subgraph` argument: path of the subgraph folder associated with the foundry project. The task checks that it corresponds to a properly formatted YAML file
  - Validates subgraph.yaml structure including required fields (specVersion, dataSources, etc.)
  - Validates data source configuration including event handlers
  - Takes a `--name` argument: name of the folder containing the foundry project (defaults to foundry)
  - Creates or updates a `config.json` registry file in the repository root
  - Registry is a map indexed by project name containing subgraph path
- `subgraph:remove [<name>] [--force]` 
  - Removes a foundry project from registry and filesystem
  - Requires a `--name` argument: name of the project to remove
  - Supports `--force` flag to skip confirmation prompt
  - Removes project directory and all its files
  - Removes project entry from `config.json` registry
  - Removes registry file if it becomes empty
- `task contracts:generate`
  - Reads project configurations from `config.json` registry
  - Iterates over all registered projects
  - Parses each project's `subgraph.yaml`
  - Extracts events from subgraph `eventHandlers` definitions
  - For each contract name creates a Solidity contract where there is one function per associated event
  - Each function has the same arguments as the events and its purpose is only to emit the associated event
  - Generates contracts in `./{projectName}/src/` directory
- `task contracts:deploy`
  - Deploys generated contracts to the local Anvil node using Foundry scripts
- `task anvil:start | task anvil:stop | task anvil:setup`
  - Manage Anvil lifecycle; `anvil:setup` stops any running instance, starts a new one, generates contracts, and deploys them
- `task anvil:inspect <txHash>`
  - Inspect a transaction using `debug_traceTransaction` on the local Anvil node
- `task graph:start | task graph:stop | task graph:wipe`
  - Manage the local graph-node stack (IPFS, Postgres, graph-node) via Docker
  - `graph:wipe` removes IPFS and Postgres volumes
- `task graph:deploy | task graph:setup`
  - Deploy all registered subgraphs to the local node; `graph:setup` runs stop → wipe → start → deploy
- `task event <project> <datasource> <event> [args...]`
  - Print a ready-to-run `cast send` command for a project's datasource event


## Quality

No compile warnings - All code passes Deno linting without warnings
