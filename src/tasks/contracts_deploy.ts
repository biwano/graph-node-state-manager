import { exists } from "std/fs/exists.ts";
import { getActiveProjects, getProjectConfig } from "../utils/config.ts";
import { clearContracts } from "../utils/config.ts";
import { parseSubgraph } from "../utils/subgraph.ts";
import { SUBGRAPH_YAML_FILENAME } from "../utils/constants.ts";
import { deployContract } from "./contracts_deploy_template.ts";



export async function deployProjectContractsTask(projectName: string, projectDir: string): Promise<void> {
  if (!(await exists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  // Clear all existing contracts from config at the start
  await clearContracts(projectName);
  console.debug(`🧹 Cleared existing contracts from config for project: ${projectName}`);

  // Get the subgraph path to determine which contracts are data sources
  const projectConfig = await getProjectConfig(projectName);
  const subgraphPath = projectConfig.subgraph_path;
  const subgraphYamlPath = `${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`;
  
  const subgraphData = await parseSubgraph(subgraphYamlPath);
  
  console.info(`🚀 Deploying ${subgraphData.dataSources.length} data source contracts for project: ${projectName}`);

  // Deploy each data source contract individually
  for (const contract of subgraphData.dataSources) {
    const scriptPath = `${projectDir}/script/Deploy${contract.name}.s.sol`;
    
    if (!(await exists(scriptPath))) {
      console.warn(`Deployment script not found for ${contract.name}: ${scriptPath}`);
      continue;
    }

    console.debug(`Deploying contract (anvil_setCode): ${contract.name}`);
    try {
      await deployContract(projectName, contract.name, contract.name, contract.address);
    } catch (e) {
      console.error(`Failed to deploy ${contract.name}:`, e instanceof Error ? e.message : String(e));
      continue;
    }
  }

  console.info(`✅ Data source contracts deployed successfully for project: ${projectName}.`);
}

export async function deployAllProjectsContractsTask(): Promise<void> {
  const config = await getActiveProjects();
  const projectNames = Object.keys(config);

  for (const projectName of projectNames) {
    const projectDir = `./foundry/${projectName}`;
    await deployProjectContractsTask(projectName, projectDir);
  }
}


