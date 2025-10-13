import { EVENT_SCRIPT, SHELL } from "../utils/constants.ts";

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


export async function addStateTask(files: string[]): Promise<void> {
  if (files.length === 0) {
    console.error("❌ No event files specified");
    Deno.exit(1);
  }

  await assertEventFilesExist(files);

  for (const file of files) {
    const eventFilePath = `events/${file}`;
    console.debug(`🚀 Executing event file: ${eventFilePath}`);
    
    const process = new Deno.Command(SHELL, {
      args: [eventFilePath],
      env: {
        EVENT: EVENT_SCRIPT,
      },
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await process.output();
    const stdoutText = new TextDecoder().decode(stdout);

    if (code !== 0) {
      console.error(`❌ Event file ${file} failed with exit code ${code}`);
      
      // Output stdout if there's any content
      if (stdoutText.trim()) {
        console.error("📤 stdout:");
        console.error(stdoutText);
      }
      
      // Output stderr if there's any content
      const stderrText = new TextDecoder().decode(stderr);
      if (stderrText.trim()) {
        console.error("📤 stderr:");
        console.error(stderrText);
      }
      
      Deno.exit(1);
    }
    else {
      console.debug(stdoutText);
    }
    console.info(`✅ Event file ${file} completed successfully`);
  }
}
