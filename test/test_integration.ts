#!/usr/bin/env -S deno run --allow-all

import { ensureDir, copy } from "std/fs/mod.ts";
import { DENO_COMMAND_OPTIONS } from "../src/utils/constants.ts";
import { readConfig } from "../src/utils/config.ts";
import { waitForGraphNode, waitForGraphSync } from "../src/utils/graph-node.ts";

async function copyTestEvents(): Promise<string[]> {
  console.log("📁 Copying test event files...");
  
  // Ensure events directory exists
  await ensureDir("events");
  
  // List all files in test/events directory
  const testEventsDir = "test/events";
  const copiedFiles: string[] = [];
  
  try {
    for await (const dirEntry of Deno.readDir(testEventsDir)) {
      if (dirEntry.isFile) {
        const sourcePath = `${testEventsDir}/${dirEntry.name}`;
        const destPath = `events/${dirEntry.name}`;
        
        console.log(`  Copying ${sourcePath} -> ${destPath}`);
        await copy(sourcePath, destPath, { overwrite: true });
        copiedFiles.push(dirEntry.name);
      }
    }
  } catch (error) {
    throw new Error(`Failed to read test events directory: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  if (copiedFiles.length === 0) {
    throw new Error("No test event files found in test/events directory");
  }
  
  console.log(`✅ Copied ${copiedFiles.length} test event files: ${copiedFiles.join(", ")}`);
  return copiedFiles;
}

async function installTestSubgraph(): Promise<void> {
  console.log("📦 Installing test subgraph...");
  
  const process = new Deno.Command("deno", {
    args: ["task", "run", "subgraph", "add", "./test/subgraph", "--name", "default"],
    ...DENO_COMMAND_OPTIONS,
  });

  const { code, stdout, stderr } = await process.output();

  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`Subgraph installation failed: ${errorText}`);
  }

  console.log("✅ Test subgraph installed");
}

async function runStateSetup(eventFiles: string[]): Promise<void> {
  console.log("🚀 Running state setup...");
  
  const process = new Deno.Command("deno", {
    args: ["task", "run", "set-state", ...eventFiles],
    ...DENO_COMMAND_OPTIONS,
  });
  
  const { code, stdout, stderr } = await process.output();
  
  if (code !== 0) {
    const errorText = new TextDecoder().decode(stderr);
    throw new Error(`State setup failed: ${errorText}`);
  }
  
  console.log("✅ State setup completed");
}

interface Account {
  id: string;
  address: string;
  state: string;
  totalResets: string;
  totalUpdates: string;
  registeredAt?: string;
  lastUpdatedAt?: string;
}

interface GraphQLResponse {
  data: {
    accounts: Account[];
  };
}

function normalizeResponse(response: GraphQLResponse): GraphQLResponse {
  // Remove variable fields that might change between runs
  const normalized = JSON.parse(JSON.stringify(response)) as GraphQLResponse;
  
  // Sort accounts by id to ensure consistent comparison
  if (normalized.data?.accounts) {
    normalized.data.accounts.sort((a: Account, b: Account) => a.id.localeCompare(b.id));
    
    // Remove timestamp fields that vary between runs
    normalized.data.accounts.forEach((account: Account) => {
      delete account.registeredAt;
      delete account.lastUpdatedAt;
    });
  }
  
  return normalized;
}

async function loadExpectedResponse(): Promise<any> {
  const fixturePath = "test/fixtures/expected_graphql_response.json";
  const content = await Deno.readTextFile(fixturePath);
  return JSON.parse(content);
}





async function queryGraphQL(): Promise<void> {
  console.log("🔍 Querying GraphQL...");
  
  // Read config to get GraphQL URL
  const config = await readConfig();
  const graphqlUrl = config.default?.graphql_url;
  
  if (!graphqlUrl) {
    throw new Error("No GraphQL URL found in config");
  }
  
  console.log(`GraphQL URL: ${graphqlUrl}`);
  
  // Wait for graph to sync with Anvil blocks
  await waitForGraphSync(graphqlUrl);
  
  // Query for accounts with all relevant state fields
  const query = `
    query {
      accounts {
        id
        address
        state
        totalResets
        totalUpdates
      }
    }
  `;
  
  const response = await fetch(graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
  }
  
  
  // Load expected response from fixture
  const expectedResponse = await loadExpectedResponse();
  
  // Normalize both responses for comparison
  const normalizedResult = normalizeResponse(result);
  const normalizedExpected = normalizeResponse(expectedResponse);
  
  // Compare the normalized responses
  if (JSON.stringify(normalizedResult) !== JSON.stringify(normalizedExpected)) {
    console.error("❌ GraphQL response does not match expected fixture:");
    console.error("Actual:", JSON.stringify(normalizedResult, null, 2));
    console.error("Expected:", JSON.stringify(normalizedExpected, null, 2));
    throw new Error("GraphQL response does not match expected fixture");
  }
  console.log("✅ GraphQL validation completed");
}

async function cleanup(copiedFiles: string[]): Promise<void> {
  console.log("🧹 Cleaning up test files...");
  
  for (const file of copiedFiles) {
    try {
      await Deno.remove(`events/${file}`);
      console.log(`  Removed events/${file}`);
    } catch (error) {
      console.warn(`Warning: Could not remove events/${file}:`, error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log("✅ Test files cleaned up");
}

async function main(): Promise<void> {
  let copiedFiles: string[] = [];
  
  try {
    console.log("🧪 Starting integration test...");
    
    await installTestSubgraph();
    copiedFiles = await copyTestEvents();
    await runStateSetup(copiedFiles);
    await queryGraphQL();
    
    console.log("🎉 Integration test completed successfully!");
    
  } catch (error) {
    console.error("❌ Integration test failed:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  } finally {
    await cleanup(copiedFiles);
  }
}

if (import.meta.main) {
  await main();
}
