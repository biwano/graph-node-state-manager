import { GRAPH_NODE_URL, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

export async function startGraphNodeTask(): Promise<void> {
  console.log("🚀 Starting graph-node with docker-compose...");

  // Start graph-node using docker-compose
  const dockerComposeProcess = new Deno.Command("docker", {
    args: ["compose", "up", "-d", "graph-node"],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await dockerComposeProcess.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to start graph-node: ${errorText}`);
  }

  console.log("✅ Graph-node started");
  console.log(new TextDecoder().decode(stdout));

  // Wait for graph-node to be ready by checking its health endpoint
  console.log("⏳ Waiting for graph-node to be ready...");
  const maxRetries = 30;
  const retryDelay = 2000; // 2 seconds

  for (let i = 0; i < maxRetries; i++) {
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

      if (response.ok) {
        console.log("✅ Graph-node is ready and accepting connections");
        return;
      }
    } catch {
      // Graph-node not ready yet, continue waiting
    }

    console.log(`⏳ Graph-node not ready yet, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error("Graph-node failed to start within the expected time");
}
