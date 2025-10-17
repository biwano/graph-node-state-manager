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

export async function mineAnvilBlocks(blockCount: number = 1): Promise<void> {
  try {
    const response = await fetch(ANVIL_DEFAULT_RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "anvil_mine",
        params: [blockCount.toString()],
        id: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to mine Anvil blocks: ${response.status}`);
    }

    const result = await response.json();
    if (result.error) {
      throw new Error(`Anvil mining error: ${result.error.message}`);
    }
  } catch (error) {
    throw new Error(`Failed to mine Anvil blocks: ${error instanceof Error ? error.message : String(error)}`);
  }
}
