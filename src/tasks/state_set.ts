import { killAnvilTask } from "./anvil_kill.ts";
import { startAnvilTask } from "./anvil_start.ts";
import { generateAllProjectsTask } from "./contracts_generate.ts";
import { deployAllProjectsContractsTask } from "./contracts_deploy.ts";
import { stopGraphNodeTask } from "./graph_stop.ts";
import { wipeGraphNodeTask } from "./graph_wipe.ts";
import { startGraphNodeTask } from "./graph_start.ts";
import { deployAllGraphsTask } from "./graph_deploy.ts";
import { addStateTask, assertEventFilesExist } from "./state_add.ts";
import { logDeployedSubgraphsSummary } from "../utils/config.ts";

export async function setStateTask(files: string[]): Promise<void> {
  console.info("🚀 Starting set state command...");

  await assertEventFilesExist(files);

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

  await Promise.all([
    deployAllProjectsContractsTask(),
    (async () => {
      await startGraphNodeTask();
      await deployAllGraphsTask();
    })()
  ]);

  await addStateTask(files);
  
  // Print deployed projects and their GraphQL URLs
  await logDeployedSubgraphsSummary();

  console.info("🎉 State command completed successfully!");
}