export async function stopGraphNodeTask(): Promise<void> {
  console.log("🛑 Stopping graph-node...");

  // Stop graph-node using docker-compose
  const dockerComposeProcess = new Deno.Command("docker", {
    args: ["compose", "down"],
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await dockerComposeProcess.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to stop graph-node: ${errorText}`);
  }

  console.log("✅ Graph-node stopped");
  console.log(new TextDecoder().decode(stdout));
}
