import { exists } from "std/fs/exists.ts";
import { REGISTRY_PATH, FOUNDRY_ROOT } from "./constants.ts";

export interface ProjectConfigContract { name: string; address: string }
export interface ProjectConfigEntry { subgraph_path: string; contracts?: ProjectConfigContract[] }
export type ProjectConfig = Record<string, ProjectConfigEntry>

export async function readConfig(): Promise<ProjectConfig> {
  if (!(await exists(REGISTRY_PATH))) return {};
  const content = await Deno.readTextFile(REGISTRY_PATH);
  return JSON.parse(content) as ProjectConfig;
}

export async function writeConfig(config: ProjectConfig): Promise<void> {
  await Deno.writeTextFile(REGISTRY_PATH, JSON.stringify(config, null, 2));
}

export async function upsertProject(projectName: string, entry: Partial<ProjectConfigEntry>): Promise<ProjectConfig> {
  const cfg = await readConfig();
  const current = cfg[projectName] || { subgraph_path: "", contracts: [] };
  const merged: ProjectConfigEntry = {
    subgraph_path: entry.subgraph_path ?? current.subgraph_path,
    contracts: entry.contracts ?? current.contracts,
  };
  cfg[projectName] = merged;
  await writeConfig(cfg);
  return cfg;
}

export async function removeProject(projectName: string): Promise<void> {
  const cfg = await readConfig();
  if (!(projectName in cfg)) return;
  delete cfg[projectName];
  if (Object.keys(cfg).length === 0) {
    await Deno.remove(REGISTRY_PATH).catch(() => {});
    return;
  }
  await writeConfig(cfg);
}

export async function upsertContracts(projectName: string, addresses: Record<string, string>): Promise<void> {
  const cfg = await readConfig();
  const current = cfg[projectName] || { subgraph_path: "", contracts: [] };
  const map = new Map<string, string>((current.contracts || []).map((c) => [c.name, c.address]));
  for (const [name, addr] of Object.entries(addresses)) map.set(name, addr);
  current.contracts = Array.from(map.entries()).map(([name, address]) => ({ name, address }));
  cfg[projectName] = current;
  await writeConfig(cfg);
}

export async function getDeployedAddress(projectName: string, contractName: string): Promise<string | null> {
  const cfg = await readConfig();
  const entry = cfg[projectName];
  if (!entry || !entry.contracts) return null;
  const found = entry.contracts.find((c) => c.name === contractName);
  return found ? found.address : null;
}


