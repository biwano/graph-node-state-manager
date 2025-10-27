import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { getProjectConfig } from "../utils/config.ts";
import { parseSubgraph } from "../utils/subgraph.ts";
import { SUBGRAPH_YAML_FILENAME } from "../utils/constants.ts";
import { getDeployedAddress } from "../utils/config.ts";
import { cliLog } from "../utils/logging.ts";

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

function eventSignature(name: string, types: string[]): string {
  return `${name}(${types.join(",")})`;
}

function extractTransactionHash(output: string): string {
  // Look for "transactionHash" followed by spaces and a 64-character hex string
  const txHashMatch = output.match(/transactionHash\s+(0x[a-fA-F0-9]{64})/i);
  if (txHashMatch) {
    return txHashMatch[1];
  }
  
  throw new Error(`Could not extract transaction hash from output: ${output}`);
}


function validateArgFormat(type: string, value: string): string | null {
  const t = type.trim();
  
  // Handle array types
  if (t.endsWith("[]")) {
    const elementType = t.slice(0, -2);
    // Parse array value - expect format like "[value1,value2,value3]" or "[]"
    if (!/^\[.*\]$/.test(value)) {
      return `invalid array format (expected [value1,value2,...] or [])`;
    }
    
    // Extract array contents
    const arrayContent = value.slice(1, -1).trim();
    if (arrayContent === "") {
      return null; // empty array is valid
    }
    
    // Split by comma and validate each element
    const elements = arrayContent.split(",").map(el => el.trim());
    for (const element of elements) {
      const error = validateArgFormat(elementType, element);
      if (error) {
        return `invalid array element: ${error}`;
      }
    }
    return null;
  }
  
  // Handle fixed-size arrays like uint256[3]
  const fixedArrayMatch = t.match(/^(.+)\[(\d+)\]$/);
  if (fixedArrayMatch) {
    const elementType = fixedArrayMatch[1];
    const expectedLength = parseInt(fixedArrayMatch[2], 10);
    
    // Parse array value
    if (!/^\[.*\]$/.test(value)) {
      return `invalid array format (expected [value1,value2,...])`;
    }
    
    const arrayContent = value.slice(1, -1).trim();
    if (arrayContent === "") {
      return expectedLength === 0 ? null : `invalid array length (expected ${expectedLength} elements, got 0)`;
    }
    
    const elements = arrayContent.split(",").map(el => el.trim());
    if (elements.length !== expectedLength) {
      return `invalid array length (expected ${expectedLength} elements, got ${elements.length})`;
    }
    
    for (const element of elements) {
      const error = validateArgFormat(elementType, element);
      if (error) {
        return `invalid array element: ${error}`;
      }
    }
    return null;
  }
  
  // Handle non-array types
  if (t === "address") {
    return /^0x[0-9a-fA-F]{40}$/.test(value) ? null : `invalid address (expected 0x-prefixed 40 hex chars)`;
  }
  if (t === "bool") {
    return /^(true|false|0|1)$/i.test(value) ? null : `invalid bool (expected true|false|0|1)`;
  }
  if (t === "string") {
    return null; // any string accepted
  }
  if (t.startsWith("bytes")) {
    const m = t.match(/^bytes(\d+)?$/);
    if (!m) return "invalid bytes type";
    if (!/^0x[0-9a-fA-F]*$/.test(value)) return "invalid bytes (expected 0x-hex)";
    if (m[1]) {
      const size = parseInt(m[1], 10);
      const hexLen = value.length - 2;
      if (hexLen !== size * 2) return `invalid ${t} (expected ${size} bytes, got ${hexLen / 2})`;
    }
    return null;
  }
  if (/^(u?int)(\d+)?$/.test(t)) {
    // Accept decimal or 0x-hex numbers
    if (/^0x[0-9a-fA-F]+$/.test(value)) return null;
    if (/^[0-9]+$/.test(value)) return null;
    return "invalid integer (expected decimal or 0x-hex)";
  }
  return null; // other solidity types not strictly validated here
}


export async function castEvent(
  projectName: string,
  alias: string,
  eventName: string,
  eventArgs: string[],
): Promise<void> {
  const projectConfig = await getProjectConfig(projectName);
  if (!projectConfig || !projectConfig.contracts) {
    throw new Error(`No contracts found for project '${projectName}'. Deploy contracts first.`);
  }

  // Find the contract by alias
  const contractEntry = projectConfig.contracts[alias];
  if (!contractEntry) {
    const knownAliases = Object.keys(projectConfig.contracts).join(", ");
    throw new Error(`Unknown contract alias '${alias}'. Known aliases: ${knownAliases}`);
  }

  // Get contract details from subgraph using the contractName
  const subgraphPath = projectConfig.subgraph_path;
  const { dataSources, templates } = await parseSubgraph(`${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`);
  const contracts = [...dataSources, ...templates];
  const contract = contracts.find((c) => c.name === contractEntry.contractName);
  if (!contract) {
    throw new Error(`Contract '${contractEntry.contractName}' not found in subgraph definition`);
  }

  const event = contract.events.find((e) => e.name === eventName);
  if (!event) {
    const knownEvents = contract.events
      .map((e) => eventSignature(e.name, e.params.map((i) => i.type)))
      .join(", ");
    throw new Error(`Unknown event '${eventName}'. Known events: ${knownEvents}`);
  }

  const expectedTypes = event.params.map((i) => i.type);
  if (eventArgs.length !== expectedTypes.length) {
    const sig = eventSignature(event.name, expectedTypes);
    throw new Error(`Invalid argument count: got ${eventArgs.length}, expected ${expectedTypes.length}. Signature: ${sig}. Passed arguments: [${eventArgs.join(", ")}]`);
  }

  for (let i = 0; i < expectedTypes.length; i++) {
    const err = validateArgFormat(expectedTypes[i], eventArgs[i]);
    if (err) {
      const sig = eventSignature(event.name, expectedTypes);
      throw new Error(`Invalid argument #${i + 1} ('${event.params[i].name}'): ${err}. Signature: ${sig}. passed : ${eventArgs[i]}`);
    }
  }

  // Require an actual deployed address from config; do not fallback to subgraph address
  const address = await getDeployedAddress(projectName, alias);
  if (!address) {
    throw new Error(
      `No deployed address found for alias '${alias}' in project '${projectName}'. ` +
      `Deploy contracts first (e.g., 'deno task run task anvil:setup') so addresses are recorded in config.json.`
    );
  }

  const methodSig = `emit${capitalize(event.name)}(${expectedTypes.join(",")})`;
  const args = [
    "send",
    address,
    methodSig,
    ...eventArgs,
    "--rpc-url",
    ANVIL_DEFAULT_RPC_URL,
    "--private-key",
    ANVIL_DEFAULT_PRIVATE_KEY,
  ];

  console.debug(`cast ${args.join(" ")}`);

  const cmd = new Deno.Command("cast", {
    args,
    ...DENO_COMMAND_OPTIONS,
  });
  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }
  const output = new TextDecoder().decode(stdout);
  console.debug(output);
  console.info("✅ Event transaction sent successfully.");
 
  const txHash = extractTransactionHash(output);
  cliLog(txHash);

}


