import { Command } from "cliffy/command";
import { DOCKER_COMPOSE_TEMPLATE } from "../templates/docker_compose.ts";
import { GITIGNORE_TEMPLATE } from "../templates/gitignore.ts";
import { SAMPLE_EVENT_TEMPLATE } from "../templates/sample_event.ts";
import { readConfig, writeConfig } from "../utils/config.ts";

export const initCommand = new Command()
  .description("Initialize a new project directory with events and docker-compose.yml")
  .arguments("<dir:string>")
  .action(async (_options, dir: string) => {
    // Create events directory
    const eventsDir = `${dir}/events`;
    await Deno.mkdir(eventsDir, { recursive: true });

    // Write sample event file
    await Deno.writeTextFile(`${eventsDir}/sample`, SAMPLE_EVENT_TEMPLATE);

    // Write docker-compose.yml
    await Deno.writeTextFile(`${dir}/docker-compose.yml`, DOCKER_COMPOSE_TEMPLATE);

    // Write .gitignore
    await Deno.writeTextFile(`${dir}/.gitignore`, GITIGNORE_TEMPLATE);

    // Write config
    const cfg = await readConfig();
    const parts = dir.replace(/\\+/g, "/").split("/").filter(Boolean);
    const prefix = parts[parts.length - 1] || "gnsm";
    cfg.name = prefix;
    await writeConfig(cfg);

    console.info(`✅ Scaffolded project at ${dir}`);
  });


