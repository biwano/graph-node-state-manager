import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

async function removeVolume(volumeName: string, displayName: string): Promise<void> {
  console.log(`🗑️  Removing ${displayName} data volume...`);
  
  const volumeProcess = new Deno.Command("docker", {
    args: ["volume", "rm", volumeName],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await volumeProcess.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    if (!errorText.toLowerCase().includes("no such volume")) {
      throw new Error(`Failed to remove ${displayName} volume: ${errorText}`);
    }
    console.log(`ℹ️  ${displayName} volume not found (already removed)`);
  } else {
    console.log(`✅ ${displayName} data volume removed`);
    console.log(new TextDecoder().decode(stdout));
  }
}

export async function wipeGraphNodeTask(): Promise<void> {
  console.log("🧹 Wiping graph-node data...");

  await removeVolume("gnsm-ipfs-data", "IPFS");
  await removeVolume("gnsm-postgres-data", "Postgres");

  console.log("✅ Graph-node data wiped successfully");
}
