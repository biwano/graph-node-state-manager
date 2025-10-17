import { Command } from "cliffy/command";
import { killAnvilTask } from "../tasks/anvil_kill.ts";
import { deployAllProjectsContractsTask } from "../tasks/contracts_deploy.ts";
import { deployTemplateTask } from "../tasks/contracts_deploy_template.ts";
import { startAnvilTask } from "../tasks/anvil_start.ts";
import { startGraphNodeTask } from "../tasks/graph_start.ts";
import { stopGraphNodeTask } from "../tasks/graph_stop.ts";
import { wipeGraphNodeTask } from "../tasks/graph_wipe.ts";
import { deployAllGraphsTask } from "../tasks/graph_deploy.ts";
import { castEvent } from "../tasks/event_cast.ts";
import { generateAllProjectsTask } from "../tasks/contracts_generate.ts";
import { inspectTxTask } from "../tasks/anvil_inspect.ts";
import { addStateTask } from "../tasks/state_add.ts";
import { cliLog } from "../utils/logging.ts";
import { mineAnvilBlocks } from "../utils/anvil.ts";

export const killAnvilCommand = new Command()
  .name("anvil:stop")
  .description("Stop anvil if it is running")
  .action(async () => {
    try {
      await killAnvilTask();
    } catch (error) {
      console.error("Error killing anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const startAnvilCommand = new Command()
  .name("anvil:start")
  .description("Start anvil in the background and wait for it to start")
  .action(async () => {
    try {
      await startAnvilTask();
    } catch (error) {
      console.error("Error starting anvil:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


export const anvilSetupCommand = new Command()
  .name("anvil:setup")
  .description("Setup anvil and deploy contracts: kill existing anvil, start new anvil, deploy contracts")
  .action(async () => {
    try {
      await killAnvilTask();
      await startAnvilTask();
      await generateAllProjectsTask();
      await deployAllProjectsContractsTask();
    } catch (error) {
      console.error("Error during anvil setup:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const anvilMineCommand = new Command()
  .name("anvil:mine")
  .description("Mine one or more blocks on the local anvil node")
  .arguments("[blocks:number]")
  .action(async (_options, blocks: number = 1) => {
    try {
      await mineAnvilBlocks(blocks);
      console.info(`✅ Mined ${blocks} block(s) successfully`);
    } catch (error) {
      console.error("Error mining blocks:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const generateCommand = new Command()
  .name("contracts:generate")
  .description("Generate fake contracts for all registered projects based on subgraph definitions")
  .action(async () => {
    try {
      await generateAllProjectsTask();
    } catch (error) {
      console.error("Error generating fake contracts:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });


export const deployCommand = new Command()
  .name("contracts:deploy")
  .description("Deploy generated fake contracts on the local Anvil fork using Foundry script")
  .action(async () => {
    try {
      await deployAllProjectsContractsTask();
    } catch (error) {
      console.error("Error deploying fakes:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const deployTemplateCommand = new Command()
  .name("contracts:deploy_template")
  .description("Deploy a template contract with a custom alias")
  .arguments("<project:string> <template:string> <alias:string>")
  .action(async (_options, project: string, template: string, alias: string) => {
    try {
      const address = await deployTemplateTask(project, template, alias);
      // If CLI flag is set, output the deployed address
      cliLog(address);
    } catch (error) {
      console.error("Error deploying template:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const startGraphCommand = new Command()
  .name("graph:start")
  .description("Start graph-node")
  .action(async () => {
    try {
      await startGraphNodeTask();
    } catch (error) {
      console.error("Error starting graph-node:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const stopGraphCommand = new Command()
  .name("graph:stop")
  .description("Stop graph-node")
  .action(async () => {
    try {
      await stopGraphNodeTask();
    } catch (error) {
      console.error("Error stopping graph-node:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const wipeGraphCommand = new Command()
  .name("graph:wipe")
  .description("Wipe graph-node data (delete node-data folder)")
  .action(async () => {
    try {
      await wipeGraphNodeTask();
    } catch (error) {
      console.error("Error wiping graph-node data:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const deployGraphCommand = new Command()
  .name("graph:deploy")
  .description("Deploy all subgraphs to local graph-node")
  .action(async () => {
    try {
      await deployAllGraphsTask();
    } catch (error) {
      console.error("Error deploying subgraphs:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const setupGraphCommand = new Command()
  .name("graph:setup")
  .description("Complete graph setup: stop, wipe, start, and deploy all subgraphs")
  .action(async () => {
    try {
      
      // Stop graph-node if running
      await stopGraphNodeTask();
      
      // Wipe graph-node data
      await wipeGraphNodeTask();
      
      // Start graph-node
      await startGraphNodeTask();
      
      // Deploy all subgraphs
      await deployAllGraphsTask();
      
    } catch (error) {
      console.error("Error during graph setup:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const eventCommand = new Command()
  .name("event")
  .arguments("<project:string> <alias:string> <event:string> [args...:string]")
  .description("Generate a cast send command for a project's contract alias event")
  .option("--no-mine", "Don't mine blocks after sending the transaction")
  .action(async (options, project: string, alias: string, event: string, ...args: string[]) => {
    try {
      await castEvent(project, alias, event, args, !options.noMine);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const anvilInspectCommand = new Command()
  .name("anvil:inspect")
  .arguments("<txHash:string>")
  .description("Inspect a transaction using debug_traceTransaction on the local Anvil node")
  .action(async (_options, txHash: string) => {
    try {
      await inspectTxTask(txHash);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const addStateCommand = new Command()
  .name("add-state")
  .description("Execute event files with EVENT environment variable set")
  .arguments("[files...:string]")
  .action(async (_options, ...files: string[]) => {
    try {
      await addStateTask(files);
    } catch (error) {
      console.error("Error executing add-state command:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

  
export const taskCommand = new Command()
  .name("task")
  .description("Task commands")
  .command("anvil:start", startAnvilCommand)
  .command("anvil:stop", killAnvilCommand)
  .command("anvil:setup", anvilSetupCommand)
  .command("anvil:mine", anvilMineCommand)
  .command("anvil:inspect", anvilInspectCommand)
  .command("contracts:generate", generateCommand)
  .command("contracts:deploy", deployCommand)
  .command("contracts:deploy_template", deployTemplateCommand)
  .command("graph:start", startGraphCommand)
  .command("graph:stop", stopGraphCommand)
  .command("graph:wipe", wipeGraphCommand)
  .command("graph:deploy", deployGraphCommand)
  .command("graph:setup", setupGraphCommand)
  .command("event", eventCommand)
  .command("state:add", addStateCommand)
  

