import { exists } from "std/fs/exists.ts";
import { REGISTRY_PATH } from "./constants.ts";

export async function validateRegistry(): Promise<Record<string, { subgraph_path: string }>> {
  // Check if registry exists
  if (!(await exists(REGISTRY_PATH))) {
    throw new Error("No projects found in registry. Run 'subgraph:add' first.");
  }

  const registryContent = await Deno.readTextFile(REGISTRY_PATH);
  const registry = JSON.parse(registryContent) as Record<string, { subgraph_path: string }>;
  
  const projectNames = Object.keys(registry);
  if (projectNames.length === 0) {
    throw new Error("No projects found in registry. Run 'subgraph:add' first.");
  }

  return registry;
}
