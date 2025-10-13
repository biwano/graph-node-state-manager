import { ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";

export async function inspectTxTask(txHash: string): Promise<void> {
  const res = await fetch(ANVIL_DEFAULT_RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "debug_traceTransaction", params: [txHash] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RPC error (${res.status}): ${text}`);
  }
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || JSON.stringify(json.error));
  }
  console.info(JSON.stringify(json.result, null, 2));
}


