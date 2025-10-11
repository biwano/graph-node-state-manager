import { readConfig, writeConfig } from "../utils/config.ts";

export async function subgraphActivateTask(projectName: string): Promise<void> {
  const config = await readConfig();
  
  if (!config[projectName]) {
    throw new Error(`Project '${projectName}' not found in config`);
  }
  
  config[projectName].active = true;
  await writeConfig(config);
  
  console.log(`✅ Subgraph '${projectName}' activated`);
}
