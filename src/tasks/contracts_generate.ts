import { ensureDir } from "std/fs/ensure_dir.ts";
import { join } from "std/path/mod.ts";
import { parseSubgraph } from "../utils/subgraph.ts";
import { SUBGRAPH_YAML_FILENAME } from "../utils/constants.ts";
import { generateFakeContract } from "../utils/contract_generator.ts";
import { buildDeployScript } from "../utils/contract_generator.ts";
import { getActiveProjects } from "../utils/config.ts";

export async function generateForProjectTask(projectName: string, subgraphPath: string, outRoot: string): Promise<void> {
  const resolvedSubgraphYamlPath = `${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`;
  const outputDir = `${outRoot}/${projectName}/src`;

  console.info(`🔧 Generating fake contracts for project: ${projectName}`);

  const subgraphData = await parseSubgraph(resolvedSubgraphYamlPath);
  console.debug(`Found ${subgraphData.contracts.length} contracts in subgraph`);

  await ensureDir(outputDir);
  const scriptDir = join(`${outRoot}/${projectName}`, "script");
  await ensureDir(scriptDir);

  for (const contract of subgraphData.contracts) {
    console.debug(`Generating fake contract for: ${contract.name}`);
    const contractCode = await generateFakeContract(contract);
    const outputPath = join(outputDir, `${contract.name}.sol`);
    await Deno.writeTextFile(outputPath, contractCode);
    console.debug(`  Created: ${outputPath}`);
  }

  const deployScriptPath = join(scriptDir, "Deploy.s.sol");
  const deployScript = await buildDeployScript(projectName, subgraphData.contracts);
  await Deno.writeTextFile(deployScriptPath, deployScript);
  console.debug(`Created deployment script: ${deployScriptPath}`);

  console.info(`✅ Fake contracts generated successfully for project: ${projectName}!`);
}

export async function generateAllProjectsTask(): Promise<void> {
  const config = await getActiveProjects();
  const projectNames = Object.keys(config);

  for (const projectName of projectNames) {
    const projectConfig = config[projectName];
    await generateForProjectTask(projectName, projectConfig.subgraph_path, "./foundry");
  }
}


