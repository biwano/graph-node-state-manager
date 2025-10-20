import { upsertContract } from "../utils/config.ts";
import { DENO_COMMAND_OPTIONS, ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";

export async function deployTemplateTask(
  projectName: string, 
  templateName: string, 
  alias: string
): Promise<string> {
  console.info(`🚀 Deploying template '${templateName}' with alias '${alias}' for project: ${projectName}`);

  // Use the pre-generated deploy script for the template and record under alias
  const address = await deployContract(projectName, templateName, alias);
  console.info(`✅ Template '${templateName}' deployed successfully as '${alias}'`);
  return address;
}

async function getRuntimeBytecode(projectDir: string, contractName: string): Promise<string> {
  // Ensure build artifacts exist
  const buildCmd = new Deno.Command("forge", { args: ["build"], cwd: projectDir, ...DENO_COMMAND_OPTIONS });
  await buildCmd.output();

  // Inspect runtime bytecode
  const inspectCmd = new Deno.Command("forge", {
    args: ["inspect", contractName, "deployedBytecode"],
    cwd: projectDir,
    ...DENO_COMMAND_OPTIONS,
  });
  const { code, stdout, stderr } = await inspectCmd.output();
  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }
  const bytecode = new TextDecoder().decode(stdout).trim();
  if (!bytecode || !bytecode.startsWith("0x")) {
    throw new Error("Failed to obtain runtime bytecode");
  }
  return bytecode;
}

async function jsonRpc<T = unknown>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(ANVIL_DEFAULT_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`RPC ${method} failed: HTTP ${res.status}`);
  const body = await res.json();
  if (body.error) throw new Error(`RPC ${method} error: ${body.error.message || JSON.stringify(body.error)}`);
  return body.result as T;
}

async function generateDeterministicAddress(projectName: string, contractName: string): Promise<string> {
  const input = `${projectName}:${contractName}`;
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const hashBytes = new Uint8Array(hashBuffer);
  // Take first 20 bytes for address
  const addrBytes = hashBytes.slice(0, 20);
  // Ensure first byte isn't zero to avoid leading zeros-only address
  if (addrBytes[0] === 0) addrBytes[0] = 1;
  const hex = Array.from(addrBytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
}

export async function deployContract(
  projectName: string,
  contractName: string,
  alias?: string,
  address?: string,
): Promise<string> {
  const projectDir = `./foundry/${projectName}`;
  const runtimeBytecode = await getRuntimeBytecode(projectDir, contractName);
  const deterministicAddress = await generateDeterministicAddress(projectName, contractName);
  const isValidAddress = address && !(/^0x0{40}$/i.test(address));
  const targetAddress = isValidAddress ? address : deterministicAddress;

  console.info(`🧪 Injecting code for ${contractName} at ${targetAddress} via anvil_setCode`);
  await jsonRpc("anvil_setCode", [targetAddress, runtimeBytecode]);

  const finalAlias = alias ?? contractName;
  await upsertContract(projectName, finalAlias, contractName, targetAddress);
  return targetAddress;
}
