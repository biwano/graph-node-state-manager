import { exists } from "std/fs/exists.ts";
import { removeProject } from "../utils/config.ts";

export async function subgraphRemoveTask(projectDir: string, projectName: string, force: boolean): Promise<void> {
  if (!(await exists(projectDir))) {
    console.log(`Project directory '${projectDir}' not found. Removing from registry only.`);
    return;
  }

  if (!force) {
    console.log(`This will permanently delete the project at '${projectDir}' and all its files.`);
    const response = prompt("Are you sure you want to continue? (y/N): ");
    if (response?.toLowerCase() !== 'y' && response?.toLowerCase() !== 'yes') {
      console.log("Operation cancelled.");
      Deno.exit(0);
    }
  }

  await Deno.remove(projectDir, { recursive: true });
  console.log(`✅ Removed project directory: ${projectDir}`);

  // Update registry
  await removeProject(projectName);
  console.log("✅ Updated registry file");

  console.log(`✅ Successfully removed project '${projectName}'`);
}


