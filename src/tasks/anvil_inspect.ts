import { jsonRpc } from "../utils/anvil.ts";

export async function inspectTxTask(txHash: string): Promise<void> {
  const result = await jsonRpc("debug_traceTransaction", [txHash]);
  console.info(JSON.stringify(result, null, 2));
}


