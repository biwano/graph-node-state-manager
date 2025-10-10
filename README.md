# Anvil Event Faker

A CLI tool to create fake contracts that only emit events based on subgraph definitions.

## Prerequisites

Before using this tool, make sure you have the following installed:

- **Deno** - JavaScript/TypeScript runtime
- **Foundry** - For smart contract development
- **Graph CLI** - For subgraph deployment (`npm install -g @graphprotocol/graph-cli`)
- **Docker Compose** - For running graph-node and IPFS services

## Installation

```bash
deno task install
```

## Usage

### Register a subgraph and initialize a foundry project

```bash
deno task run subgraph add --subgraph <path> [--name <name>]
```

This command:
- Creates a new foundry project using `forge init`
- Registers the subgraph in the project registry

### Generate fake contracts

```bash
deno task run task generate:contracts
```

This command:
- Reads all registered subgraph.yaml files
- Parses contract ABIs and extracts events
- Generates fake Solidity contracts that emit those events

### Deploy contracts

```bash
deno task run task deploy:contracts
```

This command:
- Deploys all generated fake contracts to Anvil
- Uses the default Anvil private key and RPC URL

### Manage graph-node

```bash
# Start graph-node
deno task run task graph:start

# Stop graph-node
deno task run task graph:stop

# Wipe graph-node data
deno task run task graph:wipe

# Deploy subgraphs
deno task run task subgraph:deploy
```

## Configuration

The tool uses a project registry (`config.json`) to track registered subgraphs and their associated foundry projects.

## Example Workflow

1. Register a subgraph and initialize a project:
   ```bash
   deno task run subgraph add --subgraph ./my-subgraph --name my-project
   ```

2. Generate fake contracts for all registered projects:
   ```bash
   deno task run task generate:contracts
   ```

3. Start Anvil and deploy contracts:
   ```bash
   deno task run task anvil:setup
   ```

4. Start graph-node and deploy subgraphs:
   ```bash
   deno task run task graph:start
   deno task run task subgraph:deploy
   ```

This will create Solidity contracts in the foundry projects, each with functions that emit the events defined in your subgraph.
