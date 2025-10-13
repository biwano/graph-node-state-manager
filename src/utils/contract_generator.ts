import { Contract } from "./types.ts";
import vento from "vento";
import { CONTRACT_TEMPLATE } from "../templates/contract.ts";
import { DEPLOY_SCRIPT_TEMPLATE } from "../templates/deploy_script.ts";

export async function generateFakeContract(contract: Contract): Promise<string> {
  if (!contract.events || contract.events.length === 0) {
    throw new Error(`No events found for contract '${contract.name}'`);
  }
  const eventDeclarations = contract.events.map(e => `    event ${e.name}(${formatEventParameters(e.inputs)});`);

  const functionsDeclarations = contract.events.map((e, index) => {
    const event = contract.events[index];
    const funcName = `emit${capitalize(e.name)}`;
    const params = formatFunctionParameters(event.inputs);
    const emitArgs = formatEmitArguments(event.inputs);
    return `    function ${funcName}(${params}) external {\n        emit ${event.name}(${emitArgs});\n    }`;
  });

  return await renderWithVento(CONTRACT_TEMPLATE, {
    name: contract.name,
    eventDeclarations,
    functionsDeclarations,
  });
}

function formatEventParameters(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs
    .map((input) => `${input.type} ${input.indexed ? "indexed " : ""}${input.name}`)
    .join(", ");
}

function formatFunctionParameters(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs.map((input) => {
    // Add data location for array types in external functions
    if (input.type.includes("[]")) {
      return `${input.type} calldata ${input.name}`;
    }
    return `${input.type} ${input.name}`;
  }).join(", ");
}

function formatEmitArguments(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs.map((input) => input.name).join(", ");
}

function capitalize(str: string): string {
  return str.length ? str[0].toUpperCase() + str.slice(1) : str;
}

export async function buildDeployScript(_projectName: string, contracts: Contract[]): Promise<string> {
  const data = {
    contracts: contracts.map((c) => ({
      ...c,
      instanceName: `inst${c.name}`,
    })),
  } as Record<string, unknown>;
  return await renderWithVento(DEPLOY_SCRIPT_TEMPLATE, data);
}

export async function renderWithVento(templateSource: string, data: Record<string, unknown>): Promise<string> {
  try {
    const env = vento();
    const result = await env.runString(templateSource, data);
    return result.content;
  } catch (_e) {
    // Bubble up error to let caller decide fallback
    throw _e;
  }
}