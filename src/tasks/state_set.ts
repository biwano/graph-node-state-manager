import { killAnvilTask } from "./anvil_kill.ts";
import { startAnvilTask } from "./anvil_start.ts";
import { generateAllProjectsTask } from "./contracts_generate.ts";
import { deployAllProjectsTask } from "./contracts_deploy.ts";
import { ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY } from "../utils/constants.ts";
import { stopGraphNodeTask } from "./graph_stop.ts";
import { wipeGraphNodeTask } from "./graph_wipe.ts";
import { startGraphNodeTask } from "./graph_start.ts";
import { deployAllGraphsTask } from "./graph_deploy.ts";
import { addStateTask } from "./state_add.ts";

export async function setStateTask(files: string[]): Promise<void> {
  console.log("🚀 Starting set state command...");
/*
  await Promise.all([
    (async () => {
      await killAnvilTask();
      await startAnvilTask();
    })(),
    generateAllProjectsTask(),
    (async () => {
      await stopGraphNodeTask();
      await wipeGraphNodeTask();
    })()])
*/
  await Promise.all([
    deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY),
    (async () => {
      await startGraphNodeTask();
      console.log("aadsqd")
      await deployAllGraphsTask();
      console.log("bbdsqd")
    })()
  ]);
  console.log("ccdsqd")

  await addStateTask(files);
  
  
  console.log("🎉 State command completed successfully!");
}