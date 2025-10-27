import { parse as parseYaml } from "std/yaml/mod.ts";
import { Contract, ContractEvent, ContractEventParams } from "./types.ts";

// Strongly typed shape for subgraph.yaml
export interface SubgraphYaml {
  specVersion: string;
  schema?: { file: string };
  dataSources?: DataSource[];
  templates?: DataSource[];
}

export interface DataSource {
  kind?: string;
  name: string;
  network?: string;
  source: {
    address?: string;
    abi?: string;
    startBlock?: number;
  };
  mapping: Mapping;
}

export interface Mapping {
  kind?: string;
  apiVersion?: string;
  language?: string;
  entities?: string[];
  abis?: Array<{ name: string; file: string }>;
  eventHandlers?: EventHandler[];
  file?: string;
}

export interface EventHandler {
  event: string;
  handler: string;
}

export interface SubgraphData {
  dataSources: Contract[];
  templates: Contract[];
}


export async function parseSubgraph(subgraphPath: string): Promise<SubgraphData> {
  try {
    const subgraphContent = await Deno.readTextFile(subgraphPath);
    const subgraph = parseYaml(subgraphContent) as SubgraphYaml;
    
    const dataSources: Contract[] = [];
    const templates: Contract[] = [];
    
    // Parse data sources from subgraph
    if (subgraph.dataSources && Array.isArray(subgraph.dataSources)) {
      const dataSourceContracts = parseDataSources(subgraph.dataSources, false);
      dataSources.push(...dataSourceContracts);
    }
    
    // Parse templates from subgraph
    if (subgraph.templates && Array.isArray(subgraph.templates)) {
      const templateContracts = parseDataSources(subgraph.templates, true);
      templates.push(...templateContracts);
    }
    
    return { dataSources, templates };
    
  } catch (error) {
    throw new Error(`Failed to parse subgraph: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseDataSources(sources: DataSource[], isTemplate: boolean): Contract[] {
  const contracts: Contract[] = [];
  
  for (const source of sources) {
    const mapping = source.mapping;
    if (mapping && mapping.eventHandlers && Array.isArray(mapping.eventHandlers)) {
      const contractName = source.name;
      const events: ContractEvent[] = mapping.eventHandlers
        .map((handler) => parseEventSignature(handler.event));
      
      if (events.length > 0) {
        contracts.push({
          name: contractName,
          address: isTemplate 
            ? "0x0000000000000000000000000000000000000000" // Templates don't have fixed addresses
            : (source.source.address || "0x0000000000000000000000000000000000000000"),
          events: events,
          type: isTemplate ? "template" : "datasource"
        });
      }
    }
  }
  
  return contracts;
}

function findMatchingParentheses(str: string, startIndex: number): { start: number; end: number } | null {
  const openParen = str.indexOf('(', startIndex);
  if (openParen === -1) return null;
  
  let parenCount = 0;
  let endIndex = -1;
  
  for (let i = openParen; i < str.length; i++) {
    if (str[i] === '(') parenCount++;
    if (str[i] === ')') parenCount--;
    if (parenCount === 0) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) return null;
  return { start: openParen, end: endIndex };
}

function splitByCommaIgnoringNestedParens(str: string): string[] {
  const params: string[] = [];
  let currentParam = '';
  let parenCount = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
    
    if (char === ',' && parenCount === 0) {
      params.push(currentParam.trim());
      currentParam = '';
    } else {
      currentParam += char;
    }
  }
  if (currentParam.trim()) {
    params.push(currentParam.trim());
  }
  
  return params;
}

function parseTupleContent(tupleContent: string, baseName: string): Array<ContractEventParams> {
  const params: Array<ContractEventParams> = [];
  const splitParams = splitByCommaIgnoringNestedParens(tupleContent);
  
  let fieldIndex = 0;
  for (const param of splitParams) {
    if (!param.trim()) continue;

    const parts = param.split(/\s+/);
    const indexed = parts[0] === 'indexed';
    const type = indexed ? (parts[1] || '') : (parts[0] || '');
    const fieldName = indexed ? (parts[2] || `arg${fieldIndex}`) : (parts[1] || `arg${fieldIndex}`);

    
    const result: ContractEventParams = {
      name: fieldName,
      rawType: type,
      contractType: type,
    };
    
    // Check if this is a nested tuple
    if (type.startsWith('(') && type.includes(',')) {
      const typeSuffix = type.slice(type.indexOf(')') + 1);
      const nestedTupleContent = type.slice(1, type.indexOf(')'));
      result.structName = `Struct${baseName}Field${fieldIndex}`;
      result.contractType = `${result.structName}${typeSuffix}`;
      result.structParams = parseTupleContent(nestedTupleContent, `${baseName}Field${fieldIndex}`);
    }
    
    params.push(result);
    fieldIndex += 1;
  }
  
  return params;
}

function parseEventSignature(eventSignature: string): ContractEvent {
  const eventName = eventSignature.split('(')[0];

  // Find the content between the outermost parentheses
  const parenMatch = findMatchingParentheses(eventSignature, 0);
  if (!parenMatch) return { name: eventName, params: [] };
  
  const paramsString = eventSignature.substring(parenMatch.start + 1, parenMatch.end);
  
  return { name: eventName, params: parseTupleContent(paramsString, eventName) };
}
