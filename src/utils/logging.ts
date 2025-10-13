import { readConfig } from "./config.ts";

export async function configureLogging(): Promise<void> {
  try {
    const config = await readConfig();
    const logLevel = config.logLevel || "info";
    
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
