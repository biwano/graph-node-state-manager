export interface WaitForServiceOptions {
  maxRetries?: number;
  retryDelay?: number;
  serviceName?: string;
}

export async function waitForService(
  checkFunction: () => Promise<boolean>,
  options: WaitForServiceOptions = {}
): Promise<void> {
  const {
    maxRetries = 30,
    retryDelay = 2000,
    serviceName = "service"
  } = options;

  console.log(`⏳ Waiting for ${serviceName} to be ready...`);

  for (let i = 0; i < maxRetries; i++) {
    try {
      const isReady = await checkFunction();
      if (isReady) {
        console.log(`✅ ${serviceName} is ready and accepting connections`);
        return;
      }
    } catch {
      // Service not ready yet, continue waiting
    }

    console.log(`⏳ ${serviceName} not ready yet, retrying in ${retryDelay}ms... (attempt ${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
  }

  throw new Error(`${serviceName} failed to start within the expected time`);
}


