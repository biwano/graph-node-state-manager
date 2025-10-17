const cwd = Deno.cwd();

export const ANVIL_DEFAULT_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
export const ANVIL_DEFAULT_RPC_URL = "http://localhost:8545";
export const GRAPH_NODE_URL = "http://localhost:8020";
export const IPFS_URL = "http://localhost:5001";
export const CONFIG_PATH = `${cwd}/config.json`;
export const FOUNDRY_ROOT = `${cwd}/foundry`;
export const DEFAULT_PROJECT_NAME = "default";
export const SUBGRAPH_YAML_FILENAME = "subgraph.yaml";
export const EVENT_SCRIPT = "graph-node-state-manager task event --cli";
export const DEPLOY_TEMPLATE_SCRIPT = "graph-node-state-manager task contracts:deploy_template --cli";
export const SHELL = "bash";
export const DENO_COMMAND_OPTIONS = {
  stdout: "piped" as const,
  stderr: "piped" as const,
  env: {
    NO_COLOR: "1",
    FORCE_COLOR: "0",
  },
};
export const GRAPH_SYNC_MAX_WAIT_TIME = 60000; // 60 seconds


