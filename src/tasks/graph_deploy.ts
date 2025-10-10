import { exists } from "std/fs/exists.ts";
import { parse as yamlParse, stringify as yamlStringify } from "std/yaml/mod.ts";
import { GRAPH_NODE_URL, IPFS_URL, SUBGRAPH_YAML_FILENAME, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { validateRegistry } from "../utils/registry.ts";
import { readConfig, setGraphQLUrl } from "../utils/config.ts";

async function prepareSubgraphYamlWithDeployedAddresses(
  subgraphYamlPath: string,
  projectName: string,
): Promise<{ modified: boolean; originalContent: string }> {
  // Build address map from config
  const cfg = await readConfig();
  const contracts = cfg[projectName]?.contracts || [];
  const nameToAddress = new Map<string, string>();
  for (const c of contracts) {
    if (c.name && c.address) nameToAddress.set(c.name, c.address);
  }

  // Backup and maybe rewrite subgraph.yaml
  const originalContent = await Deno.readTextFile(subgraphYamlPath);
  const doc = yamlParse(originalContent) as { dataSources?: Array<{ name?: string; source?: { address?: string } }> };
  const dataSources = Array.isArray(doc.dataSources) ? doc.dataSources : [];
  let modified = false;
  for (const ds of dataSources) {
    const dsName = ds?.name as string | undefined;
    if (!dsName) continue;
    const newAddr = nameToAddress.get(dsName);
    if (newAddr && ds.source) {
      if (!ds.source.address || ds.source.address !== newAddr) {
        ds.source.address = newAddr;
        modified = true;
      }
    }
  }
  if (modified) {
    const tmpContent = yamlStringify(doc);
    await Deno.writeTextFile(subgraphYamlPath, tmpContent);
  }
  console.log(modified
    ? `📝 ${SUBGRAPH_YAML_FILENAME} addresses temporarily updated from config`
    : "ℹ️ No datasource address updates needed (no matching deployed contracts found)");

  return { modified, originalContent };
}

async function createSubgraph(projectName: string, cwd?: string): Promise<void> {
  console.log(`📝 Creating subgraph: ${projectName}`);
  const createProcess = new Deno.Command("npx", {
    args: [
      "@graphprotocol/graph-cli",
      "create",
      "--node", `${GRAPH_NODE_URL}/`,
      projectName,
    ],
    cwd: cwd,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await createProcess.output();
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    if (!errorText.toLowerCase().includes("already exists")) {
      throw new Error(`Failed to create subgraph ${projectName}: ${errorText}`);
    }
    console.log(`ℹ️  Subgraph ${projectName} already exists, continuing with deployment`);
    return;
  }
  console.log(`✅ Subgraph ${projectName} created successfully`);
  console.log(new TextDecoder().decode(stdout));
}

async function deploySubgraphVersion(projectName: string, cwd?: string): Promise<string> {
  const versionLabel = `v${Date.now()}`;

  console.log(`🚀 Deploying subgraph: ${projectName} with version: ${versionLabel}`);
  const deployProcess = new Deno.Command("npx", {
    args: [
      "@graphprotocol/graph-cli",
      "deploy",
      "--node", `${GRAPH_NODE_URL}/`,
      "--ipfs", IPFS_URL,
      "--version-label", versionLabel,
      projectName,
      SUBGRAPH_YAML_FILENAME,
    ],
    cwd: cwd,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await deployProcess.output();
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Failed to deploy subgraph ${projectName}: ${errorText}`);
  }
  
  const output = new TextDecoder().decode(stdout);
  console.log(`✅ Subgraph ${projectName} deployed successfully`);
  console.log(output);
  
  // Extract IPFS hash from "Build completed" line
  // The output contains a line like "Build completed: QmUvX7Mi9KU72Rwa11SNY1Fo82iq8atXa4V7MqWtjyEqSD"
  const buildCompletedMatch = output.match(/Build completed: ([a-zA-Z0-9]+)/);

  if (!buildCompletedMatch) {
    throw new Error(`Could not extract deployment info from output: ${output}`);
  }
  
  // Use IPFS hash as deployment ID
  const deploymentId = buildCompletedMatch[1];
  console.log(`📝 Deployment ID (IPFS hash): ${deploymentId}`);
  const graphqlUrl = `http://localhost:8000/subgraphs/id/${deploymentId}`;
 
  
  // Save GraphQL URL
  await setGraphQLUrl(projectName, graphqlUrl);
  console.log(`📝 GraphQL URL saved: ${graphqlUrl}`);
 
  return graphqlUrl;
}

async function deploySubgraph(subgraphPath: string, projectName: string): Promise<void> {
  const subgraphYamlPath = `${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`;
  
  if (!(await exists(subgraphYamlPath))) {
    throw new Error(`${SUBGRAPH_YAML_FILENAME} not found at ${subgraphYamlPath}`);
  }

  console.log(`🚀 Creating and deploying subgraph for project: ${projectName}`);

  const { modified, originalContent } = await prepareSubgraphYamlWithDeployedAddresses(
    subgraphYamlPath,
    projectName,
  );
 
  // Deploy from subgraph directory
  await createSubgraph(projectName, subgraphPath);
  await deploySubgraphVersion(projectName, subgraphPath);
  
  if (modified) {
    await Deno.writeTextFile(subgraphYamlPath, originalContent);
    console.log(`🔁 Restored original ${SUBGRAPH_YAML_FILENAME}`);
  }
}

export async function deployAllGraphsTask(): Promise<void> {
  console.log("🚀 Deploying all subgraphs to local graph-node...");
  
  const registry = await validateRegistry();
  const projectNames = Object.keys(registry);

  for (const projectName of projectNames) {
    const projectConfig = registry[projectName];
    const subgraphPath = projectConfig.subgraph_path;
    
    await deploySubgraph(subgraphPath, projectName);
  }

  console.log("✅ All subgraphs deployed successfully");
}
