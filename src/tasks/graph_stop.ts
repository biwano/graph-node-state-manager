import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

export async function stopGraphNodeTask(): Promise<void> {
  console.log("🛑 Stopping graph-node...");

  // Get the current working directory (where docker-compose.yml is located)
  const cwd = Deno.cwd();

  // Stop graph-node using docker-compose
  const dockerComposeProcess = new Deno.Command("docker", {
    args: ["compose", "down"],
    cwd: cwd,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stderr } = await dockerComposeProcess.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to stop graph-node: ${errorText}`);
  }

  console.log("✅ Graph-node stopped");
}
