import { exists } from "std/fs/exists.ts";
import { CONFIG_PATH } from "./constants.ts";

export interface ProjectConfigContract { 
  name: string; 
  address: string; 
}

export interface ProjectConfigEntry { 
  subgraph_path: string; 
  contracts?: ProjectConfigContract[];
  graphql_url?: string;
  active?: boolean;
}

export interface ProjectConfig {
  name?: string; // global prefix for volumes and project
  logLevel?: string; // logging level: silent, error, warn, info
  subgraphs: Record<string, ProjectConfigEntry>;
}

export async function readConfig(): Promise<ProjectConfig> {
  if (!(await exists(CONFIG_PATH))) return { name: undefined, subgraphs: {} };
  const content = await Deno.readTextFile(CONFIG_PATH);
  const parsed = JSON.parse(content) as ProjectConfig;
  if (!parsed || typeof parsed !== "object" || !("subgraphs" in parsed)) {
    throw new Error("Invalid config format: expected { name?: string, subgraphs: { ... } }");
  }
  return { name: parsed.name, subgraphs: parsed.subgraphs || {} };
}

export async function writeConfig(config: ProjectConfig): Promise<void> {
  const normalized: ProjectConfig = {
    name: config.name,
    subgraphs: config.subgraphs || {},
  };
  await Deno.writeTextFile(CONFIG_PATH, JSON.stringify(normalized, null, 2));
}

export async function upsertProject(projectName: string, entry: Partial<ProjectConfigEntry>): Promise<ProjectConfig> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] || { subgraph_path: "", contracts: [] };
  const merged: ProjectConfigEntry = { ...current, ...entry };
  cfg.subgraphs[projectName] = merged;
  await writeConfig(cfg);
  return cfg;
}

export async function removeProject(projectName: string): Promise<void> {
  const cfg = await readConfig();
  if (!(projectName in cfg.subgraphs)) return;
  delete cfg.subgraphs[projectName];
  if (Object.keys(cfg.subgraphs).length === 0 && !cfg.name) {
    await Deno.remove(CONFIG_PATH).catch(() => {});
    return;
  }
  await writeConfig(cfg);
}

export async function upsertContracts(projectName: string, addresses: Record<string, string>): Promise<void> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] || { subgraph_path: "", contracts: [] };
  const map = new Map<string, string>((current.contracts || []).map((c) => [c.name, c.address]));
  for (const [name, addr] of Object.entries(addresses)) map.set(name, addr);
  current.contracts = Array.from(map.entries()).map(([name, address]) => ({ name, address }));
  cfg.subgraphs[projectName] = current;
  await writeConfig(cfg);
}

export async function getDeployedAddress(projectName: string, contractName: string): Promise<string | null> {
  const cfg = await readConfig();
  const entry = cfg.subgraphs[projectName];
  if (!entry || !entry.contracts) return null;
  const found = entry.contracts.find((c) => c.name === contractName);
  return found ? found.address : null;
}

export async function setGraphQLUrl(projectName: string, graphqlUrl: string): Promise<void> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] || { subgraph_path: "", contracts: [] };
  current.graphql_url = graphqlUrl;
  cfg.subgraphs[projectName] = current;
  await writeConfig(cfg);
}

export async function getActiveProjects(): Promise<Record<string, { subgraph_path: string }>> {
  // Check if config exists
  if (!(await exists(CONFIG_PATH))) {
    throw new Error("No projects found in config. Run 'subgraph:add' first.");
  }

  const configContent = await Deno.readTextFile(CONFIG_PATH);
  const config = JSON.parse(configContent) as ProjectConfig;
  
  // Filter for active projects only
  const activeProjects: Record<string, { subgraph_path: string }> = {};
  for (const [projectName, projectConfig] of Object.entries(config.subgraphs)) {
    if (projectConfig.active === true) {
      activeProjects[projectName] = { subgraph_path: projectConfig.subgraph_path };
    }
  }
  
  const activeProjectNames = Object.keys(activeProjects);
  if (activeProjectNames.length === 0) {
    throw new Error("No active projects found in config. Run 'subgraph:activate' first.");
  }

  return activeProjects;
}


