import { exists } from "std/fs/exists.ts";
import { CONFIG_PATH } from "./constants.ts";

export interface ProjectConfigContract {
  alias: string;
  contractName: string;
  address: string;
}

export interface ProjectConfigEntry {
  subgraph_path: string;
  shouldNotUseTemplateAddress?: string[];
  contracts?: Record<string, ProjectConfigContract>;
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
    throw new Error(
      "Invalid config format: expected { name?: string, subgraphs: { ... } }",
    );
  }
  return {
    name: parsed.name,
    logLevel: parsed.logLevel,
    subgraphs: parsed.subgraphs || {},
  };
}

export async function writeConfig(config: ProjectConfig): Promise<void> {
  const normalized: ProjectConfig = {
    name: config.name,
    logLevel: config.logLevel,
    subgraphs: config.subgraphs || {},
  };
  await Deno.writeTextFile(CONFIG_PATH, JSON.stringify(normalized, null, 2));
}

export async function upsertProject(
  projectName: string,
  entry: Partial<ProjectConfigEntry>,
): Promise<ProjectConfig> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] ||
    { subgraph_path: "", contracts: {} };
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

/**
 * Checks if another contract in the config already uses the given address.
 * Throws an error if a duplicate is found (excluding the current contract being updated).
 */
function validateAddressUniqueness(
  config: ProjectConfig,
  address: string,
  projectName: string,
  alias: string,
): void {
  for (
    const [subgraphName, subgraphEntry] of Object.entries(config.subgraphs)
  ) {
    if (subgraphEntry.contracts) {
      for (
        const [contractAlias, contract] of Object.entries(
          subgraphEntry.contracts,
        )
      ) {
        if (
          contract.address === address &&
          !(subgraphName === projectName && contractAlias === alias)
        ) {
          throw new Error(
            `Address ${address} is already used by contract "${contractAlias}" (${contract.contractName}) in project "${subgraphName}"`,
          );
        }
      }
    }
  }
}

export async function upsertContract(
  projectName: string,
  alias: string,
  contractName: string,
  address: string,
): Promise<void> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] ||
    { subgraph_path: "", contracts: {} };
  const contracts = current.contracts || {};

  validateAddressUniqueness(cfg, address, projectName, alias);

  const entry: ProjectConfigContract = { alias, contractName, address };
  contracts[alias] = entry;
  current.contracts = contracts;
  cfg.subgraphs[projectName] = current;
  await writeConfig(cfg);
}

export async function clearContracts(projectName: string): Promise<void> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] ||
    { subgraph_path: "", contracts: {} };
  current.contracts = {};
  cfg.subgraphs[projectName] = current;
  await writeConfig(cfg);
}

export async function getDeployedAddress(
  projectName: string,
  alias: string,
): Promise<string | null> {
  const cfg = await readConfig();
  const entry = cfg.subgraphs[projectName];
  if (!entry || !entry.contracts) return null;
  const found = entry.contracts[alias];
  return found ? found.address : null;
}

/**
 * Print a summary of deployed subgraphs and their GraphQL URLs.
 * Best-effort; does not throw if config is missing or unreadable.
 */
export async function logDeployedSubgraphsSummary(): Promise<void> {
  try {
    const cfg = await readConfig();
    const subgraphs = cfg.subgraphs || {};
    const deployed = Object.entries(subgraphs)
      .map(([name, entry]) => ({
        name,
        url: (entry as { graphql_url?: string }).graphql_url,
      }))
      .filter((x) => Boolean(x.url));

    if (deployed.length > 0) {
      console.info("📝 Deployed subgraphs (GraphQL URLs):");
      for (const { name, url } of deployed) {
        console.info(`  • ${name}: ${url}`);
      }
    } else {
      console.warn(
        "⚠️ No deployed subgraphs found in config (missing graphql_url).",
      );
    }
  } catch (_error) {
    // Ignore errors in summary logging
  }
}

export async function setGraphQLUrl(
  projectName: string,
  graphqlUrl: string,
): Promise<void> {
  const cfg = await readConfig();
  const current = cfg.subgraphs[projectName] ||
    { subgraph_path: "", contracts: [] };
  current.graphql_url = graphqlUrl;
  cfg.subgraphs[projectName] = current;
  await writeConfig(cfg);
}

export async function getActiveProjects(): Promise<
  Record<string, { subgraph_path: string }>
> {
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
      activeProjects[projectName] = {
        subgraph_path: projectConfig.subgraph_path,
      };
    }
  }

  const activeProjectNames = Object.keys(activeProjects);
  if (activeProjectNames.length === 0) {
    throw new Error(
      "No active projects found in config. Run 'subgraph:activate' first.",
    );
  }

  return activeProjects;
}

export async function getProjectConfig(
  projectName: string,
): Promise<ProjectConfigEntry> {
  const config = await readConfig();
  const knownProjects = Object.keys(config.subgraphs);
  if (!config.subgraphs[projectName]) {
    throw new Error(
      `Unknown project '${projectName}'. Known projects: ${
        knownProjects.join(", ")
      }`,
    );
  }
  return config.subgraphs[projectName];
}

/**
 * Checks if a contract name should NOT use the template address
 * by checking the forceDeterministicAddresses field in the project config
 */
export async function shouldNotUseTemplateAddress(
  projectName: string,
  contractName: string,
): Promise<boolean> {
  try {
    const config = await getProjectConfig(projectName);

    const shouldNotUseTemplateAddress = config.shouldNotUseTemplateAddress;
    return shouldNotUseTemplateAddress?.includes(contractName) ?? false;
  } catch (error) {
    console.debug(
      `Failed to check shouldNotUseTemplateAddress for ${contractName}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return false;
  }
}
