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
  console.debug(`Found ${subgraphData.dataSources.length} data sources and ${subgraphData.templates.length} templates in subgraph`);

  await ensureDir(outputDir);
  const scriptDir = join(`${outRoot}/${projectName}`, "script");
  await ensureDir(scriptDir);

  // Generate contracts for all (data sources + templates)
  const allContracts = [...subgraphData.dataSources, ...subgraphData.templates];
  for (const contract of allContracts) {
    console.debug(`Generating fake contract for: ${contract.name}`);
    const contractCode = await generateFakeContract(contract);
    const outputPath = join(outputDir, `${contract.name}.sol`);
    await Deno.writeTextFile(outputPath, contractCode);
    console.debug(`  Created: ${outputPath}`);
  }

  // Generate one deploy script per data source contract
  for (const contract of allContracts) {
    const deployScriptPath = join(scriptDir, `Deploy${contract.name}.s.sol`);
    const deployScript = await buildDeployScript(projectName, [contract]);
    await Deno.writeTextFile(deployScriptPath, deployScript);
    console.debug(`Created deployment script: ${deployScriptPath}`);
  }

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


