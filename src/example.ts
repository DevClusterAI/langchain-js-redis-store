import { RedisStore } from "./RedisStore.js";

async function simpleExample(): Promise<void> {
  // Create a RedisStore instance
  const redisStore = new RedisStore({
    redisUrl: "redis://localhost:6379",
    namespace: "example",
    ttl: 3600, // 1 hour TTL
  });

  try {
    console.log("Setting values...");
    
    // Set some values
    await redisStore.mset([
      ["key1", Buffer.from("value1")],
      ["key2", Buffer.from("value2")],
      ["prefix:key3", Buffer.from("value3")],
    ]);
    
    console.log("Values set successfully");
    
    // Get the values
    console.log("Getting values...");
    const values = await redisStore.mget(["key1", "key2", "prefix:key3", "nonexistent"]);
    
    console.log("Values retrieved:");
    values.forEach((value, index) => {
      const key = ["key1", "key2", "prefix:key3", "nonexistent"][index];
      if (value) {
        // Convert Uint8Array to string for display
        console.log(`${key}: ${value}`);
      } else {
        console.log(`${key}: <not found>`);
      }
    });
    
    // List all keys with a specific prefix
    console.log("\nListing keys with prefix 'prefix:'...");
    for await (const key of redisStore.yieldKeys("prefix:")) {
      console.log(`Found key: ${key}`);
    }
    
    // List all keys
    console.log("\nListing all keys...");
    for await (const key of redisStore.yieldKeys()) {
      console.log(`Found key: ${key}`);
    }
    
    // Delete a key
    console.log("\nDeleting key 'key1'...");
    await redisStore.mdelete(["key1"]);
    
    // Verify deletion
    const afterDelete = await redisStore.mget(["key1"]);
    console.log(`key1 after deletion: ${afterDelete[0] ? Buffer.from(afterDelete[0]).toString() : "<not found>"}`);
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close Redis connection
    await redisStore.close();
    console.log("Redis connection closed");
  }
}

async function main(): Promise<void> {
  // Simple example of direct RedisStore usage
  console.log("=== SIMPLE EXAMPLE ===");
  await simpleExample();
}

// Check if this script is being run directly
if (require.main === module) {
  main().catch(console.error);
}

export { main, simpleExample }; 