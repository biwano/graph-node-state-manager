import { readConfig } from "./config.ts";

export async function configureLogging(): Promise<void> {
  try {
    const config = await readConfig();
    const logLevel = config.logLevel || "info";
    
    switch (logLevel.toLowerCase()) {
      case "silent":
        console.info = () => {};
        console.warn = () => {};
        console.error = () => {};
        break;
      case "error":
        console.info = () => {};
        console.warn = () => {};
        // console.error remains active
        break;
      case "warn":
        console.info = () => {};
        // console.warn and console.error remain active
        break;
      case "info":
      default:
        // All console methods remain active
        break;
    }
  } catch (_error) {
    // If config can't be read, use default logging (all active)
    // This is expected for commands like 'init' that don't require a config file
  }
}
