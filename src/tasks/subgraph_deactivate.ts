import { readConfig, writeConfig } from "../utils/config.ts";

export async function subgraphDeactivateTask(projectName: string): Promise<void> {
  const config = await readConfig();
  
  if (!config[projectName]) {
    throw new Error(`Project '${projectName}' not found in config`);
  }
  
  config[projectName].active = false;
  await writeConfig(config);
  
  console.log(`✅ Subgraph '${projectName}' deactivated`);
}
