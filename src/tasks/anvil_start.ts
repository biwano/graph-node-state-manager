import { ANVIL_DEFAULT_RPC_URL, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { waitForService } from "../utils/wait_for_service.ts";

export async function startAnvilTask(): Promise<void> {
  // Start anvil in the background
  const anvilProcess = new Deno.Command("anvil", {
    args: ["--host", "0.0.0.0", "--port", "8545", "--steps-tracing"],
    ...DENO_COMMAND_OPTIONS,
  });

  anvilProcess.spawn().unref();
  console.log("🚀 Starting anvil...");

  // Wait for anvil to be ready by checking the RPC endpoint
  const checkAnvil = async (): Promise<boolean> => {
    try {
      const response = await fetch(ANVIL_DEFAULT_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1
        })
      });

      return response.ok;
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
