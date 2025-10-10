import { EVENT_SCRIPT, SHELL } from "../utils/constants.ts";

export async function addStateTask(files: string[]): Promise<void> {
  if (files.length === 0) {
    console.error("No event files specified");
    Deno.exit(1);
  }

  for (const file of files) {
    const eventFilePath = `events/${file}`;
    console.log(`🚀 Executing event file: ${eventFilePath}`);
    
    const process = new Deno.Command(SHELL, {
      args: [eventFilePath],
      env: {
        EVENT: EVENT_SCRIPT,
      },
      stdout: "inherit",
      stderr: "inherit",
    });

    const { code } = await process.output();
    if (code !== 0) {
      console.error(`❌ Event file ${file} failed with exit code ${code}`);
      Deno.exit(1);
    }
    console.log(`✅ Event file ${file} completed successfully`);
  }
}
