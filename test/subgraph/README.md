## TimedContract Subgraph

Scaffold for The Graph subgraph. Replace ABI, events, and handlers to match the deployed `TimedContract`.

Basic workflow:

1. Place `TimedContract.json` ABI in `abis/` and set the contract address in `subgraph.yaml`.
2. Install deps and generate/build:

```bash
cd modules/subgraph
npm install
npm run prepare
```

3. With a local Graph Node running, create and deploy locally:

```bash
npm run create-local
npm run deploy-local
```


