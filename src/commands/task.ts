import { Command } from "cliffy/command";
import { killAnvilTask } from "../tasks/anvil_kill.ts";
import { ANVIL_DEFAULT_PRIVATE_KEY, ANVIL_DEFAULT_RPC_URL } from "../utils/constants.ts";
import { deployAllProjectsTask } from "../tasks/contracts_deploy.ts";
import { startAnvilTask } from "../tasks/anvil_start.ts";
import { startGraphNodeTask } from "../tasks/graph_start.ts";
import { stopGraphNodeTask } from "../tasks/graph_stop.ts";
import { wipeGraphNodeTask } from "../tasks/graph_wipe.ts";
import { deployAllGraphsTask } from "../tasks/graph_deploy.ts";
import { buildEventCastCommand } from "../tasks/event_cast.ts";
import { generateAllProjectsTask } from "../tasks/contracts_generate.ts";
import { inspectTxTask } from "../tasks/anvil_inspect.ts";

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
      Deno.exit(0);
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
      await deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY);
      Deno.exit(0);
    } catch (error) {
      console.error("Error during anvil setup:", error instanceof Error ? error.message : String(error));
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
      await deployAllProjectsTask(ANVIL_DEFAULT_RPC_URL, ANVIL_DEFAULT_PRIVATE_KEY);
    } catch (error) {
      console.error("Error deploying fakes:", error instanceof Error ? error.message : String(error));
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
      
      console.log("✅ Graph setup completed successfully!");
    } catch (error) {
      console.error("Error during graph setup:", error instanceof Error ? error.message : String(error));
      Deno.exit(1);
    }
  });

export const eventCommand = new Command()
  .name("event")
  .arguments("<project:string> <datasource:string> <event:string> [args...:string]")
  .description("Generate a cast send command for a project's datasource event")
  .action(async (_options, project: string, datasource: string, event: string, ...args: string[]) => {
    try {
      await buildEventCastCommand(project, datasource, event, args);
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

  
export const taskCommand = new Command()
  .name("task")
  .description("Task commands")
  .command("anvil:start", startAnvilCommand)
  .command("anvil:stop", killAnvilCommand)
  .command("anvil:setup", anvilSetupCommand)
  .command("anvil:inspect", anvilInspectCommand)
  .command("contracts:generate", generateCommand)
  .command("contracts:deploy", deployCommand)
  .command("graph:start", startGraphCommand)
  .command("graph:stop", stopGraphCommand)
  .command("graph:wipe", wipeGraphCommand)
  .command("graph:deploy", deployGraphCommand)
  .command("graph:setup", setupGraphCommand)
  .command("event", eventCommand)
  

