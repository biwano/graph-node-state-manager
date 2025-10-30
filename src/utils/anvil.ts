import { ANVIL_DEFAULT_RPC_URL } from "./constants.ts";

export async function jsonRpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(ANVIL_DEFAULT_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`RPC ${method} error: ${body.error.message || JSON.stringify(body.error)}`);
  return body.result as T;
}

export async function getAnvilBlockNumber(): Promise<number> {
  try {
    const hex = await jsonRpc<string>("eth_blockNumber", []);
    return parseInt(hex, 16);
  } catch (error) {
    throw new Error(`Failed to get Anvil block number: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function mineAnvilBlocks(blockCount: number = 1): Promise<void> {
  try {
    await jsonRpc("anvil_mine", [blockCount.toString()]);
  } catch (error) {
    throw new Error(`Failed to mine Anvil blocks: ${error instanceof Error ? error.message : String(error)}`);
  }
}
