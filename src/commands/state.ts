import { Command } from "cliffy/command";
import { setStateTask } from "../tasks/state_set.ts";

export const setStateCommand = new Command()
  .name("set-state")
  .description("Setup anvil, graph node, and execute event files")
  .arguments("[files...:string]")
  .action(async (_options, ...files: string[]) => {
    try {
      await setStateTask(files);
    } catch (error) {
      console.error("Error in set-state command:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });
