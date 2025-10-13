import { Command } from "cliffy/command";
import { DOCKER_COMPOSE_TEMPLATE } from "../templates/docker_compose.ts";

export const initCommand = new Command()
  .description("Initialize a new project directory with events and docker-compose.yml")
  .arguments("<dir:string>")
  .action(async (_options, dir: string) => {
    const eventsDir = `${dir}/events`;
    await Deno.mkdir(eventsDir, { recursive: true });
    const sample = `# Sample events file\n# One event per line, e.g.:\n# ContractName EventName arg1=value1 arg2=value2`;
    await Deno.writeTextFile(`${eventsDir}/sample.txt`, sample);
    await Deno.writeTextFile(`${dir}/docker-compose.yml`, DOCKER_COMPOSE_TEMPLATE);
    console.log(`✅ Scaffolded project at ${dir}`);
  });


