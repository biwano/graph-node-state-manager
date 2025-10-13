import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

async function removeVolume(volumeName: string): Promise<void> {
  console.log(`🗑️  Removing volume ${volumeName}...`);
  
  const volumeProcess = new Deno.Command("docker", {
    args: ["volume", "rm", volumeName],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await volumeProcess.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    if (!errorText.toLowerCase().includes("no such volume")) {
      throw new Error(`Failed to remove volume ${volumeName}: ${errorText}`);
    }
    console.log(`ℹ️  Volume ${volumeName} not found (already removed)`);
  } else {
    console.log(`✅ Volume ${volumeName} removed`);
    console.log(new TextDecoder().decode(stdout));
  }
}

async function getDockerProjectName(): Promise<string[]> {
  console.debug("🔍 Extracting project name from docker compose...");
  
  const configProcess = new Deno.Command("docker", {
    args: ["compose", "config", "--format", "json"],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await configProcess.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to get docker compose config: ${errorText}`);
  }

  const config = JSON.parse(new TextDecoder().decode(stdout));
  
  if (!config.name) {
    throw new Error("Could not extract project name from docker-compose.yml. Make sure you're running this command from a directory with a valid docker-compose.yml file.");
  }

  return config.name;
}

export async function wipeGraphNodeTask(): Promise<void> {
  console.log("🧹 Wiping graph-node data...");

  const prefix = await getDockerProjectName();
  await removeVolume(`${prefix}-ipfs-data`);
  await removeVolume(`${prefix}-postgres-data`);


  console.log("✅ Graph-node data wiped successfully");
}
