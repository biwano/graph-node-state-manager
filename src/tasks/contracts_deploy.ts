import { exists } from "std/fs/exists.ts";
import { validateRegistry } from "../utils/registry.ts";
import { upsertContracts } from "../utils/config.ts";

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
    console.log(`Skipping: project directory not found: ${projectDir}.`);
    return;
  }
  if (!(await exists(scriptPath))) {
    console.log(`Skipping: deployment script not found: ${scriptPath}.`);
    return;
  }

  const originalCwd = Deno.cwd();
  Deno.chdir(projectDir);

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
    stdout: "piped",
    stderr: "piped",
  });

  const { code, stdout, stderr } = await cmd.output();
  Deno.chdir(originalCwd);

  if (code !== 0) {
    throw new Error(new TextDecoder().decode(stderr));
  }

  const output = new TextDecoder().decode(stdout);
  console.log(output);

  // Prefer parsing deployed addresses from stdout markers
  const deployedAddresses = parseDeployedAddressesFromStdout(output);

  if (Object.keys(deployedAddresses).length > 0) {
    await upsertContracts(projectName, deployedAddresses);
  }
  
  console.log(`✅ Deployment script executed successfully for project: ${projectDir}.`);
}

export async function deployAllProjectsTask(rpcUrl: string, privateKey: string): Promise<void> {
  const registry = await validateRegistry();
  const projectNames = Object.keys(registry);

  for (const projectName of projectNames) {
    const projectDir = `./foundry/${projectName}`;
    await deployForProjectTask(projectName, projectDir, rpcUrl, privateKey);
  }
}


