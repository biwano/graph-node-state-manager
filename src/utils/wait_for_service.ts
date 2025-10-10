import { GRAPH_NODE_URL } from "./constants.ts";

export interface WaitForServiceOptions {
  maxRetries?: number;
  retryDelay?: number;
  serviceName?: string;
}

export async function waitForService(
  checkFunction: () => Promise<boolean>,
  options: WaitForServiceOptions = {}
): Promise<void> {
  const {
    maxRetries = 30,
    retryDelay = 2000,
    serviceName = "service"
  } = options;

  console.log(`⏳ Waiting for ${serviceName} to be ready...`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const isReady = await checkFunction();
      if (isReady) {
        console.log(`✅ ${serviceName} is ready and accepting connections`);
        return;
      }
    } catch {
      // Service not ready yet, continue waiting
    }

    console.log(`⏳ ${serviceName} not ready yet, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error(`${serviceName} failed to start within the expected time`);
}

export async function waitForGraphNode(additionalDelay: number = 0): Promise<void> {
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
    serviceName: "graph-node",
    maxRetries: 30,
    retryDelay: 2000
  });

  // Add additional delay if specified (useful for waiting for subgraph sync)
  if (additionalDelay > 0) {
    console.log(`⏳ Waiting additional ${additionalDelay}ms for subgraph sync...`);
    await new Promise(resolve => setTimeout(resolve, additionalDelay));
  }
}

