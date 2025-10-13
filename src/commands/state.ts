import { Command } from "cliffy/command";
import { setStateTask } from "../tasks/state_set.ts";
import { killAnvilTask } from "../tasks/anvil_kill.ts";
import { stopGraphNodeTask } from "../tasks/graph_stop.ts";
import { startAnvilTask } from "../tasks/anvil_start.ts";
import { startGraphNodeTask } from "../tasks/graph_start.ts";

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

export const startCommand = new Command()
  .name("start")
  .description("Start Anvil and Graph Node")
  .action(async () => {
    try {
      await startAnvilTask();
      await startGraphNodeTask();
      console.log("✅ Started Anvil and Graph Node");
    } catch (error) {
      console.error("Error in state start command:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const stopCommand = new Command()
  .name("stop")
  .description("Stop Anvil and Graph Node")
  .action(async () => {
    try {
      await killAnvilTask();
      await stopGraphNodeTask();
      console.log("✅ Stopped Anvil and Graph Node");
    } catch (error) {
      console.error("Error in state stop command:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const stateCommand = new Command()
  .name("state")
  .description("Manage subgraph state")
  .command("set", setCommand)
  .command("start", startCommand)
  .command("stop", stopCommand);
