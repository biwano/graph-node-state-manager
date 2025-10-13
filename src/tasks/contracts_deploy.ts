import { exists } from "std/fs/exists.ts";
import { getActiveProjects } from "../utils/config.ts";
import { upsertContracts } from "../utils/config.ts";
import { DENO_COMMAND_OPTIONS } from "../utils/constants.ts";

function parseDeployedAddressesFromStdout(output: string): Record<string, string> {
  const res: Record<string, string> = {};
  const lines = output.split('\n');
  for (const line of lines) {
    // Expect lines like: DEPLOYED:TimedContract:0xabc...
    const m = line.match(/DEPLOYED:([^:]+):(0x[a-fA-F0-9]{40})\s*$/);
    if (m) {
      res[m[1]] = m[2];
    }
  }
  return res;
}

export async function deployForProjectTask(projectName: string, projectDir: string, rpcUrl: string, privateKey: string): Promise<void> {
  const scriptPath = `${projectDir}/script/Deploy.s.sol`;

  if (!(await exists(projectDir))) {
    throw new Error(`Project directory not found: ${projectDir}`);
  }
  if (!(await exists(scriptPath))) {
    throw new Error(`Deployment script not found: ${scriptPath}`);
  }

  const cmd = new Deno.Command("forge", {
    args: [
      "script",
      "script/Deploy.s.sol",
      "--rpc-url",
      rpcUrl,
      "--broadcast",
      "--private-key",
      privateKey,
    ],
    cwd: projectDir,
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await cmd.output();

  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  const output = new TextDecoder().decode(stdout);

  // Prefer parsing deployed addresses from stdout markers
  const deployedAddresses = parseDeployedAddressesFromStdout(output);

  if (Object.keys(deployedAddresses).length > 0) {
    await upsertContracts(projectName, deployedAddresses);
  }
  
  console.info(`✅ Contracts deployed successfully for project: ${projectName}.`);
}

export async function deployAllProjectsTask(rpcUrl: string, privateKey: string): Promise<void> {
  const config = await getActiveProjects();
  const projectNames = Object.keys(config);

  for (const projectName of projectNames) {
    const projectDir = `./foundry/${projectName}`;
    await deployForProjectTask(projectName, projectDir, rpcUrl, privateKey);
  }
}


