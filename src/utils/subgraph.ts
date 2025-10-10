import { parse as parseYaml } from "std/yaml/mod.ts";
import { Contract, Event, SubgraphData, SubgraphYaml } from "./types.ts";


export async function parseSubgraph(subgraphPath: string): Promise<SubgraphData> {
  try {
    const subgraphContent = await Deno.readTextFile(subgraphPath);
    const subgraph = parseYaml(subgraphContent) as SubgraphYaml;
    
    const contracts: Contract[] = [];
    
    // Parse data sources from subgraph
    if (subgraph.dataSources && Array.isArray(subgraph.dataSources)) {
      for (const source of subgraph.dataSources) {
        const mapping = source.mapping;
        if (mapping && mapping.eventHandlers && Array.isArray(mapping.eventHandlers)) {
          const contractName = source.name;
          const events: Event[] = mapping.eventHandlers
            .map((handler) => parseEventSignature(handler.event));
          
          if (events.length > 0) {
            contracts.push({
              name: contractName,
              address: source.source.address || "0x0000000000000000000000000000000000000000",
              events: events
            });
          }
        }
      }
    }
    
    return { contracts };
    
  } catch (error) {
    throw new Error(`Failed to parse subgraph: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseEventSignature(eventSignature: string): Event {
  const name = eventSignature.split('(')[0];

  const paramsMatch = eventSignature.match(/\(([^)]*)\)/);
  const inputs: Array<{ name: string; type: string; indexed?: boolean }> = [];
  if (paramsMatch && paramsMatch[1]) {
    const params = paramsMatch[1]
      .split(',')
      .map((p: string) => p.trim())
      .filter((p: string) => p.length > 0);

    let argIndex = 0;
    for (const param of params) {
      const parts = param.split(/\s+/);
      const indexed = parts[0] === 'indexed';
      const type = indexed ? (parts[1] || '') : (parts[0] || '');
      const paramName = indexed ? (parts[2] || `arg${argIndex}`) : (parts[1] || `arg${argIndex}`);
      inputs.push({ name: paramName, type, indexed });
      argIndex += 1;
    }
  }

  return { name, inputs };
}
