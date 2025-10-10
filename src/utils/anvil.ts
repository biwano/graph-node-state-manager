import { ANVIL_DEFAULT_RPC_URL } from "./constants.ts";

export async function getAnvilBlockNumber(): Promise<number> {
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

    if (!response.ok) {
      throw new Error(`Failed to get Anvil block number: ${response.status}`);
    }

    const result = await response.json();
    return parseInt(result.result, 16);
  } catch (error) {
    throw new Error(`Failed to get Anvil block number: ${error instanceof Error ? error.message : String(error)}`);
  }
}
