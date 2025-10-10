import { Contract } from "./types.ts";
import { renderWithVento } from "./template_renderer.ts";

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

  return await renderWithVento("Contract.vto", {
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
  return inputs.map((input) => `${input.type} ${input.name}`).join(", ");
}

function formatEmitArguments(inputs: Array<{ name: string; type: string; indexed?: boolean }>): string {
  return inputs.map((input) => input.name).join(", ");
}

function capitalize(str: string): string {
  return str.length ? str[0].toUpperCase() + str.slice(1) : str;
}