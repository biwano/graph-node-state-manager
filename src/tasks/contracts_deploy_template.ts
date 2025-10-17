import { exists } from "std/fs/exists.ts";
import { upsertContract } from "../utils/config.ts";
import { DENO_COMMAND_OPTIONS, ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";

export function parseDeployedAddressFromStdout(output: string): string {
  const lines = output.split('\n');
  for (const line of lines) {
    // Expect lines like: DEPLOYED:Name:0xabc...
    const m = line.match(/DEPLOYED:([^:]+):(0x[a-fA-F0-9]{40})\s*$/);
    if (m) {
      return m[2];
    }
  }
  return "";
}

/**
 * Runs a forge script for the given project, parses the deployed
 * address from stdout and records it in the config. If a nameKey is
 * provided, the address will be saved under that key.
 */
export async function deployContract(
  projectName: string,
  contractName: string,
  alias?: string,
): Promise<string> {
  const projectDir = `./foundry/${projectName}`;
  const scriptRelPath = `script/Deploy${contractName}.s.sol`;
  const scriptAbsPath = `${projectDir}/${scriptRelPath}`;
  
  if (!(await exists(scriptAbsPath))) {
    throw new Error(`Deployment script not found: ${scriptAbsPath}`);
  }

  const cmd = new Deno.Command("forge", {
    args: [
      "script",
      scriptRelPath,
      "--rpc-url",
      ANVIL_DEFAULT_RPC_URL,
      "--broadcast",
      "--private-key",
      ANVIL_DEFAULT_PRIVATE_KEY,
    ],
    cwd: projectDir,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await cmd.output();
  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  const output = new TextDecoder().decode(stdout);
  const address = parseDeployedAddressFromStdout(output);
  if (!address) {
    throw new Error("Failed to parse deployed address from output");
  }
  const finalAlias = alias ?? contractName;
  await upsertContract(projectName, finalAlias, contractName, address);
  
  return address
}

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
