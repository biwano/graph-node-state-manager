import { GRAPH_NODE_URL, GRAPH_SYNC_MAX_WAIT_TIME } from "./constants.ts";
import { getAnvilBlockNumber } from "./anvil.ts";
import { waitForService } from "./wait_for_service.ts";


export async function getGraphIndexedBlock(graphqlUrl: string): Promise<number | null> {
  try {
    const query = `
      query {
        _meta {
          block {
            number
          }
        }
      }
    `;

    const response = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data?._meta?.block?.number || null;
  } catch {
    return null;
  }
}


export async function waitForGraphNode(): Promise<void> {
  const checkGraphNode = async (): Promise<boolean> => {
    try {
      // Try the admin JSON-RPC endpoint - more reliable for health checks
      const response = await fetch(GRAPH_NODE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "subgraph_deploy",
          params: [],
          id: 1
        })
      });

      return response.ok;
    } catch {
      return false;
    }
  };

  await waitForService(checkGraphNode, {
    serviceName: "Graph Node",
    maxRetries: 30,
    retryDelay: 2000
  });
}

export async function waitForGraphSync(graphqlUrl: string): Promise<void> {
  const checkGraphSync = async (): Promise<boolean> => {
    try {
      const anvilBlock = await getAnvilBlockNumber();
      const graphBlock = await getGraphIndexedBlock(graphqlUrl);
      
      if (graphBlock !== null) {
        console.log(`  Anvil block: ${anvilBlock}, Graph block: ${graphBlock}`);
        return graphBlock >= anvilBlock;
      }
      
      return false;
    } catch {
      return false;
    }
  };

  await waitForService(checkGraphSync, {
    serviceName: "graph sync",
    maxRetries: Math.floor(GRAPH_SYNC_MAX_WAIT_TIME / 1000),
    retryDelay: 1000
  });
}

