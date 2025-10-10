import { Contract } from "./types.ts";
import { renderWithVento } from "./template_renderer.ts";

export async function buildDeployScript(_projectName: string, contracts: Contract[]): Promise<string> {
  const data = {
    contracts: contracts.map((c) => ({
      ...c,
      instanceName: `inst${c.name}`,
    })),
  } as Record<string, unknown>;
  return await renderWithVento("Deploy.s.vto", data);
}


