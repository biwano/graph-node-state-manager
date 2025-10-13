import { exists } from "std/fs/exists.ts";
import { removeProject } from "../utils/config.ts";

export async function subgraphRemoveTask(projectDir: string, projectName: string): Promise<void> {
  if (!(await exists(projectDir))) {
    console.log(`Project directory '${projectDir}' not found. Removing from registry only.`);
  } else {
    await Deno.remove(projectDir, { recursive: true });
    console.log(`✅ Removed project directory: ${projectDir}`);
  }

  // Update registry
  await removeProject(projectName);
  console.log("✅ Updated registry file");

  console.log(`✅ Successfully removed project '${projectName}'`);
}


