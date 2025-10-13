import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { waitForGraphNode } from "../utils/graph-node.ts";

export async function startGraphNodeTask(): Promise<void> {
  console.log("🚀 Starting graph-node with docker-compose...");

  // Get the current working directory (where docker-compose.yml is located)
  const cwd = Deno.cwd();

  // Start graph-node using docker-compose
  const dockerComposeProcess = new Deno.Command("docker", {
    args: ["compose", "up", "-d", "graph-node"],
    cwd: cwd,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await dockerComposeProcess.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to start graph-node: ${errorText}`);
  }
  // Wait for graph-node to be ready
  await waitForGraphNode();

  console.log("✅ Graph-node started");
  console.log(new TextDecoder().decode(stdout));

}
