import { ANVIL_DEFAULT_RPC_URL as _ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";
import { jsonRpc } from "../utils/anvil.ts";
import { waitForService } from "../utils/wait_for_service.ts";
import { ensureDir } from "std/fs/ensure_dir.ts";

export async function startAnvilTask(): Promise<void> {
  // Ensure logs directory exists
  await ensureDir("logs");
  
  // Start anvil in the background with stdout and stderr redirected to files
  const anvilProcess = new Deno.Command("anvil", {
    args: ["--host", "0.0.0.0", "--port", "8545", "--steps-tracing"],
    stdout: "piped",
    stderr: "piped",
    env: {
      NO_COLOR: "1",
      FORCE_COLOR: "0",
    }  });

  const child = anvilProcess.spawn();
  
  // Redirect stdout and stderr to files
  const stdoutFile = await Deno.open("logs/anvil.stdout.log", { 
    write: true, 
    create: true, 
    truncate: true 
  });
  const stderrFile = await Deno.open("logs/anvil.stderr.log", { 
    write: true, 
    create: true, 
    truncate: true 
  });
  
  // Pipe stdout and stderr to files
  child.stdout.pipeTo(stdoutFile.writable);
  child.stderr.pipeTo(stderrFile.writable);
  
  child.unref();
  console.info("🚀 Starting anvil... (output redirected to logs/anvil.stdout.log and logs/anvil.stderr.log)");

  // Wait for anvil to be ready by checking the RPC endpoint
  const checkAnvil = async (): Promise<boolean> => {
    try {
      await jsonRpc("eth_blockNumber", []);
      return true;
    } catch {
      return false;
    }
  };

  await waitForService(checkAnvil, {
    serviceName: "Anvil",
    maxRetries: 30,
    retryDelay: 1000
  });
}
