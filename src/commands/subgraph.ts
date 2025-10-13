import { Command } from "cliffy/command";
import { DEFAULT_PROJECT_NAME, FOUNDRY_ROOT } from "../utils/constants.ts";
import { subgraphAddTask } from "../tasks/subgraph_add.ts";
import { subgraphRemoveTask } from "../tasks/subgraph_remove.ts";
import { subgraphActivateTask } from "../tasks/subgraph_activate.ts";
import { subgraphDeactivateTask } from "../tasks/subgraph_deactivate.ts";

export const addCommand = new Command()
  .name("subgraph:add")
  .description("Initialize a foundry project for event faking")
  .arguments("<path:string>")
  .option("-n, --name <name>", "Name of the foundry project", { default: DEFAULT_PROJECT_NAME })
  .action(async (options: { name: string }, path: string) => {
    const projectPath = `${FOUNDRY_ROOT}/${options.name}`;
    const subgraphPath = path;
    
    try {
      await subgraphAddTask(subgraphPath, projectPath, options.name);
    } catch (error) {
      console.error("Error initializing foundry project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });



export const removeCommand = new Command()
  .name("subgraph:remove")
  .description("Remove a foundry project from registry and filesystem")
  .arguments("[name:string]")
  .action(async (_options, name?: string) => {
    try {
      const projectName = name ?? DEFAULT_PROJECT_NAME;
      const projectPath = `${FOUNDRY_ROOT}/${projectName}`;
      
      await subgraphRemoveTask(projectPath, projectName);
    } catch (error) {
      console.error("Error removing project:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const activateCommand = new Command()
  .name("activate")
  .description("Activate a subgraph")
  .arguments("<name:string>")
  .action(async (_options, name: string) => {
    try {
      await subgraphActivateTask(name);
    } catch (error) {
      console.error("Error activating subgraph:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const deactivateCommand = new Command()
  .name("deactivate")
  .description("Deactivate a subgraph")
  .arguments("<name:string>")
  .action(async (_options, name: string) => {
    try {
      await subgraphDeactivateTask(name);
    } catch (error) {
      console.error("Error deactivating subgraph:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const subgraphCommand = new Command()
  .name("subgraph")
  .description("Manage subgraphs")
  .command("add", addCommand)
  .command("remove", removeCommand)
  .command("activate", activateCommand)
  .command("deactivate", deactivateCommand);
