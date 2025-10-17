import { exists } from "std/fs/exists.ts";
import { getActiveProjects } from "../utils/config.ts";
import { upsertContracts, clearContracts } from "../utils/config.ts";
import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { parseSubgraph } from "../utils/subgraph.ts";
import { SUBGRAPH_YAML_FILENAME } from "../utils/constants.ts";
import { glob } from "std/path/glob.ts";

function parseDeployedAddressesFromStdout(output: string): Record<string, string> {
  const res: Record<string, string> = {};
  const lines = output.split('\n');
  for (const line of lines) {
    // Expect lines like: DEPLOYED:TimedContract:0xabc...
    const m = line.match(/DEPLOYED:([^:]+):(0x[a-fA-F0-9]{40})\s*$/);
    if (m) {
      res[m[1]] = m[2];
    }
  }
  return res;
}

export async function deployForProjectTask(projectName: string, projectDir: string, rpcUrl: string, privateKey: string): Promise<void> {
  if (!(await exists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }

  // Clear all existing contracts from config at the start
  await clearContracts(projectName);
  console.debug(`🧹 Cleared existing contracts from config for project: ${projectName}`);

  // Get the subgraph path to determine which contracts are data sources
  const config = await getActiveProjects();
  const projectConfig = config[projectName];
  const subgraphPath = projectConfig.subgraph_path;
  const subgraphYamlPath = `${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`;
  
  const subgraphData = await parseSubgraph(subgraphYamlPath);
  
  console.info(`🚀 Deploying ${subgraphData.dataSources.length} data source contracts for project: ${projectName}`);

  const allDeployedAddresses: Record<string, string> = {};

  // Deploy each data source contract individually
  for (const contract of subgraphData.dataSources) {
    const scriptPath = `${projectDir}/script/Deploy${contract.name}.s.sol`;
    
    if (!(await exists(scriptPath))) {
      console.warn(`Deployment script not found for ${contract.name}: ${scriptPath}`);
      continue;
    }

    console.debug(`Deploying contract: ${contract.name}`);
    
    const cmd = new Deno.Command("forge", {
      args: [
        "script",
        `script/Deploy${contract.name}.s.sol`,
        "--rpc-url",
        rpcUrl,
        "--broadcast",
        "--private-key",
        privateKey,
      ],
      cwd: projectDir,
      ...DENO_COMMAND_OPTIONS,
    });

    const { code, stdout, stderr } = await cmd.output();

    if (code !== 0) {
      console.error(`Failed to deploy ${contract.name}:`, new TextDecoder().decode(stderr));
      continue;
    }

    const output = new TextDecoder().decode(stdout);
    const deployedAddresses = parseDeployedAddressesFromStdout(output);
    Object.assign(allDeployedAddresses, deployedAddresses);
  }

  if (Object.keys(allDeployedAddresses).length > 0) {
    await upsertContracts(projectName, allDeployedAddresses);
  }
  
  console.info(`✅ Data source contracts deployed successfully for project: ${projectName}.`);
}

export async function deployAllProjectsTask(rpcUrl: string, privateKey: string): Promise<void> {
  const config = await getActiveProjects();
  const projectNames = Object.keys(config);

  for (const projectName of projectNames) {
    const projectDir = `./foundry/${projectName}`;
    await deployForProjectTask(projectName, projectDir, rpcUrl, privateKey);
  }
}


