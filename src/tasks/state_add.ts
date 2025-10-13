import { SHELL } from "../utils/constants.ts";

export async function assertEventFilesExist(files: string[]): Promise<void> {
  for (const file of files) {
    const eventFilePath = `events/${file}`;
    try {
      const stat = await Deno.stat(eventFilePath);
      if (!stat.isFile) {
        throw new Error(`Not a file: ${eventFilePath}`);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Event file not found: ${eventFilePath} (${message})`);
    }
  }
}

function getEventScript(): string {
  // Get the binary name from the executable path
  const executablePath = Deno.execPath();
  const binaryName = executablePath.split('/').pop() || 'graph-node-state-manager';
  
  // If it's the global CLI binary, use the binary name directly
  if (binaryName === 'graph-node-state-manager') {
    return "graph-node-state-manager task event";
  }
  
  // If it's running via deno, use deno task
  return "deno task run task event";
}

export async function addStateTask(files: string[]): Promise<void> {
  if (files.length === 0) {
    console.error("No event files specified");
    Deno.exit(1);
  }

  await assertEventFilesExist(files);

  const eventScript = getEventScript();

  for (const file of files) {
    const eventFilePath = `events/${file}`;
    console.log(`🚀 Executing event file: ${eventFilePath}`);
    
    const process = new Deno.Command(SHELL, {
      args: [eventFilePath],
      env: {
        EVENT: eventScript,
      },
      stdout: "piped",
      stderr: "piped",
    });

    const { code } = await process.output();
    if (code !== 0) {
      console.error(`❌ Event file ${file} failed with exit code ${code}`);
      Deno.exit(1);
    }
    console.log(`✅ Event file ${file} completed successfully`);
  }
}
