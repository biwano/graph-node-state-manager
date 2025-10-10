import { ANVIL_DEFAULT_RPC_URL, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

export async function startAnvilTask(): Promise<void> {
  // Start anvil in the background
  const anvilProcess = new Deno.Command("anvil", {
    args: ["--host", "0.0.0.0", "--port", "8545", "--steps-tracing"],
    ...DENO_COMMAND_OPTIONS,
  });

  anvilProcess.spawn().unref();
  console.log("🚀 Starting anvil...");

  // Wait for anvil to be ready by checking the RPC endpoint
  const maxRetries = 30;
  const retryDelay = 1000; // 1 second

  for (let i = 0; i < maxRetries; i++) {
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

      if (response.ok) {
        console.log("✅ Anvil is ready and accepting connections");
        return;
      }
    } catch {
      // Anvil not ready yet, continue waiting
    }

    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error("Anvil failed to start within the expected time");
}
