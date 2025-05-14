# Redis Store for LangChain.js

A Redis implementation of the `BaseStore` interface from LangChain for JavaScript/TypeScript. This allows you to use Redis as a key-value store for various LangChain components, including embedding caches.

[![npm version](https://img.shields.io/npm/v/@devclusterai/langchain-js-redis-store.svg)](https://www.npmjs.com/package/@devclusterai/langchain-js-redis-store)

## Installation

```bash
npm install @devclusterai/langchain-js-redis-store
```

## Usage

### Basic Usage

```javascript
const { RedisStore } = require("@devclusterai/langchain-js-redis-store");

// Create a new Redis store
const redisStore = new RedisStore({
  redisUrl: "redis://localhost:6379",
  namespace: "my-app", // optional namespace to prefix all keys
  ttl: 3600 // optional TTL in seconds
});

// Store values
await redisStore.mset([
  ["key1", Buffer.from("value1")],
  ["key2", Buffer.from("value2")]
]);

// Retrieve values
const values = await redisStore.mget(["key1", "key2"]);
console.log(values.map(v => v ? Buffer.from(v).toString() : null));

// Delete values
await redisStore.mdelete(["key1"]);

// Iterate over keys
for await (const key of redisStore.yieldKeys()) {
  console.log(key);
}

// Close the connection when done
await redisStore.close();
```

## Configuration

The `RedisStore` constructor accepts the following options:

| Option | Type | Description |
|--------|------|-------------|
| `client` | `Redis` | An existing Redis client instance |
| `redisUrl` | `string` | Redis connection URL (alternative to client) |
| `clientOptions` | `object` | Redis client configuration (used with redisUrl) |
| `ttl` | `number` | Time-to-live in seconds for stored keys |
| `namespace` | `string` | Prefix for all keys stored in Redis |

You must provide either `client` or `redisUrl`.

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run JavaScript example
npm run example:js

# Run TypeScript example
npm run example:ts
```

## License

This project is licensed under the MIT License. 