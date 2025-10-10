# Graph Node State Manager

A CLI tool for managing local blockchain state with subgraph integration. Generates fake contracts that emit events based on subgraph definitions and manages the complete local development stack.

## Prerequisites

- **Deno** - JavaScript/TypeScript runtime ([Install](https://deno.land/manual/getting_started/installation))
- **Foundry** - For smart contract development ([Install](https://book.getfoundry.sh/getting-started/installation))
- **Node.js** - For subgraph dependencies ([Install](https://nodejs.org/en/download/))
- **Docker** - For Graph Node ([Install](https://docs.docker.com/get-docker/))

## Installation

```bash
git clone <repository-url>
cd graph-node-state-manager
```

## Usage

### Add a subgraph

```bash
deno run --allow-all src/main.ts subgraph add <path> --name <name>
```

### Set up complete state

```bash
deno run --allow-all src/main.ts set-state [event-files...]
```

This command:
- Sets up Anvil (local Ethereum node)
- Sets up Graph Node
- Generates and deploys fake contracts
- Deploys subgraphs
- Optionally executes event files

## Event Files

Event files contain commands to emit events on deployed contracts. Place them in the `events/` directory.

### Format

Each line in an event file follows this pattern:
```
$EVENT <subgraphName> <datasourceName> <eventName> <eventArgs...>
```

### Example

```bash
# events/my-events
# $EVENT subgraphName datasourceName eventName eventArgs...
$EVENT default TimedContract StateReset 0xbFFab14C5f812d3200A333594fE86f8410848852
$EVENT default TimedContract StateUpdated 0xbFFab14C5f812d3200A333594fE86f8410848852
$EVENT default TimedContract StateReset 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
```

### Parameters

- **subgraphName**: Name of the registered subgraph
- **datasourceName**: Contract name from the subgraph definition
- **eventName**: Event name to emit
- **eventArgs**: Space-separated event arguments (addresses, values, etc.)

## Testing

Run the integration test:

```bash
deno task test
```

## Configuration

The tool uses `config.json` to track registered subgraphs, deployed contracts, and GraphQL URLs.

## CI/CD

Automated testing via GitHub Actions on pull requests.
