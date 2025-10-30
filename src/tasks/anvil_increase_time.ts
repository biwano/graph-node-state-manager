import { jsonRpc } from "../utils/anvil.ts";

export async function increaseAnvilTimeTask(seconds: number): Promise<void> {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("seconds must be a positive number");
  }
  await jsonRpc("evm_increaseTime", [Math.floor(seconds)]);
  console.info(`⏩ Increased Anvil time by ${Math.floor(seconds)} second(s)`);
}


