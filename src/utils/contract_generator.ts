import { Contract } from "./types.ts";
import vento from "vento";
import { CONTRACT_TEMPLATE } from "../templates/contract.ts";
import { DEPLOY_SCRIPT_TEMPLATE } from "../templates/deploy_script.ts";

function collectStructDeclarations(params: Array<{ structName?: string; structParams?: Array<any> }>): Array<{ name: string; fields: string }> {
  const structs: Array<{ name: string; fields: string }> = [];
  
  for (const param of params) {
    if (param.structName && param.structParams) {
      // Generate fields for this struct
      const fields = param.structParams.map((field: any) => {
        return `        ${field.type} ${field.name};`;
      }).join('\n');
      
      structs.push({
        name: param.structName,
        fields
      });
      
      // Recursively collect nested structs
      const nestedStructs = collectStructDeclarations(param.structParams);
      structs.push(...nestedStructs);
    }
  }
  
  return structs;
}

export async function generateFakeContract(contract: Contract): Promise<string> {
  if (!contract.events || contract.events.length === 0) {
    throw new Error(`No events found for contract '${contract.name}'`);
  }
  
  // Collect all struct types needed (recursively)
  const structDeclarationsSet = new Set<string>();
  const structDeclarationsArray: Array<{ name: string; fields: string }> = [];
  
  for (const event of contract.events) {
    const structs = collectStructDeclarations(event.params);
    for (const struct of structs) {
      if (!structDeclarationsSet.has(struct.name)) {
        structDeclarationsSet.add(struct.name);
        structDeclarationsArray.push(struct);
      }
    }
  }
  
  const structDeclarations = structDeclarationsArray.map(struct => 
    `    struct ${struct.name} {\n${struct.fields}\n    }`
  );
  
  const eventDeclarations = contract.events.map(e => `    event ${e.name}(${formatEventParameters(e.params)});`);

  const functionsDeclarations = contract.events.map((e, index) => {
    const event = contract.events[index];
    const funcName = `emit${capitalize(e.name)}`;
    const params = formatFunctionParameters(event.params);
    const emitArgs = formatEmitArguments(event.params);
    return `    function ${funcName}(${params}) external {\n        emit ${event.name}(${emitArgs});\n    }`;
  });

  return await renderWithVento(CONTRACT_TEMPLATE, {
    name: contract.name,
    structDeclarations,
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
    // Add data location for reference types in external functions
    if (input.type.includes("[]") || input.type === "string" || input.type.startsWith("Struct")) {
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