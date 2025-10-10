import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

export async function killAnvilTask(): Promise<void> {
  // Try to kill any existing anvil processes
  console.log("Checking for running anvil processes...");
  const killProcess = new Deno.Command("pkill", {
    args: ["-x", "anvil"],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code } = await killProcess.output();
  
  if (code === 0) {
    console.log("✅ Stopped existing anvil processes");
  } else {
    console.log("ℹ️  No anvil processes were running");
  }
}
