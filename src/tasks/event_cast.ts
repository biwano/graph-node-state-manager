import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL, DENO_COMMAND_OPTIONS } from "../utils/constants.ts";
import { getActiveProjects } from "../utils/config.ts";
import { parseSubgraph } from "../utils/subgraph.ts";
import { SUBGRAPH_YAML_FILENAME } from "../utils/constants.ts";
import { getDeployedAddress } from "../utils/config.ts";

function capitalize(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

function eventSignature(name: string, types: string[]): string {
  return `${name}(${types.join(",")})`;
}


function validateArgFormat(type: string, value: string): string | null {
  const t = type.trim();
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

// getDeployedAddress now provided by utils/config

export async function buildEventCastCommand(
  projectName: string,
  dataSourceName: string,
  eventName: string,
  eventArgs: string[],
): Promise<void> {
  const config = await getActiveProjects();
  const knownProjects = Object.keys(config);
  if (!config[projectName]) {
    throw new Error(`Unknown project '${projectName}'. Known projects: ${knownProjects.join(", ")}`);
  }

  const subgraphPath = config[projectName].subgraph_path;
  const { contracts } = await parseSubgraph(`${subgraphPath}/${SUBGRAPH_YAML_FILENAME}`);

  const contract = contracts.find((c) => c.name === dataSourceName);
  if (!contract) {
    const knownDatasources = contracts.map((c) => c.name).join(", ");
    throw new Error(`Unknown datasource '${dataSourceName}'. Known datasources: ${knownDatasources}`);
  }

  const event = contract.events.find((e) => e.name === eventName);
  if (!event) {
    const knownEvents = contract.events
      .map((e) => eventSignature(e.name, e.inputs.map((i) => i.type)))
      .join(", ");
    throw new Error(`Unknown event '${eventName}'. Known events: ${knownEvents}`);
  }

  const expectedTypes = event.inputs.map((i) => i.type);
  if (eventArgs.length !== expectedTypes.length) {
    const sig = eventSignature(event.name, expectedTypes);
    throw new Error(`Invalid argument count: got ${eventArgs.length}, expected ${expectedTypes.length}. Signature: ${sig}`);
  }

  for (let i = 0; i < expectedTypes.length; i++) {
    const err = validateArgFormat(expectedTypes[i], eventArgs[i]);
    if (err) {
      const sig = eventSignature(event.name, expectedTypes);
      throw new Error(`Invalid argument #${i + 1} ('${event.inputs[i].name}'): ${err}. Signature: ${sig}`);
    }
  }

  // Require an actual deployed address from config; do not fallback to subgraph address
  const address = await getDeployedAddress(projectName, dataSourceName);
  if (!address) {
    throw new Error(
      `No deployed address found for datasource '${dataSourceName}' in project '${projectName}'. ` +
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
  console.debug(new TextDecoder().decode(stdout));
  console.info("✅ Event transaction sent successfully.");
}


