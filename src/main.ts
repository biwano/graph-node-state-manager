#!/usr/bin/env deno run --allow-read --allow-write --allow-run --allow-net

import { Command } from "cliffy/command";
import { taskCommand } from "./commands/task.ts";
import { subgraphCommand } from "./commands/subgraph.ts";
import { stateCommand } from "./commands/state.ts";
import { initCommand } from "./commands/init.ts";
import { configureLogging } from "./utils/logging.ts";

const main = new Command()
  .name("graph-node-state-manager")
  .description("Manage fake contracts and deploy them to match a subgraph's state")
  .version("1.0.0")
  .globalOption("--cli", "CLI mode", { default: false })
  .command("subgraph", subgraphCommand)
  .command("task", taskCommand)
  .command("state", stateCommand)
  .command("init", initCommand)

if (import.meta.main) {
  // Check for --cli flag before parsing to configure logging early
  const hasCliFlag = Deno.args.includes("--cli");
  const logLevel = hasCliFlag ? "error" : undefined;
  await configureLogging(logLevel);
  
  await main.parse(Deno.args);
  Deno.exit(0);
}
