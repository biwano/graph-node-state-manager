import { readConfig } from "./config.ts";

const oldInfo = console.info;
let cliMode = false;
export function cliLog(message: string) {
  if (cliMode) {
    oldInfo(message);
  }
}

export async function configureLogging(localCliMode?: boolean): Promise<void> {
  try {
    cliMode = localCliMode ?? false;
    const config = await readConfig();
    const logLevel = cliMode ? "error" : config.logLevel || "info";
    
    switch (logLevel.toLowerCase()) {
      case "silent":
        console.error = () => {};
        /* fallthrough */
      case "error":
        console.warn = () => {};
        /* fallthrough */
      case "warn":
        console.info = () => {};
        /* fallthrough */
      case "info":
        console.debug = () => {};
    }
  } catch (_error) {
    // If config can't be read, use default logging (all active)
    // This is expected for commands like 'init' that don't require a config file
  }
}
