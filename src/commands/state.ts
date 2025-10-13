import { Command } from "cliffy/command";
import { setStateTask } from "../tasks/state_set.ts";

export const setCommand = new Command()
  .name("set")
  .description("Setup anvil, graph node, and execute event files")
  .arguments("[files...:string]")
  .action(async (_options, ...files: string[]) => {
    try {
      await setStateTask(files);
    } catch (error) {
      console.error("Error in state set command:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const stateCommand = new Command()
  .name("state")
  .description("Manage subgraph state")
  .command("set", setCommand);
