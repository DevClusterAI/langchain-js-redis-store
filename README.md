# Redis Store for LangChain.js

A Redis implementation of the `BaseStore` interface from LangChain for JavaScript/TypeScript. This allows you to use Redis as a key-value store for various LangChain components, including embedding caches.

## Installation

```bash
npm install redis_mem
```

## Usage

### Basic Usage

```javascript
const { RedisStore } = require("redis_mem");

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

### TypeScript Usage

```typescript
import { RedisStore } from "redis_mem";

const redisStore = new RedisStore({
  redisUrl: "redis://localhost:6379",
  namespace: "my-app" 
});

// Same methods as above, but with TypeScript type safety
```

### Using with CacheBackedEmbeddings

One of the most common uses for this store is to cache embeddings to avoid recomputing them:

```typescript
import { RedisStore } from "redis_mem";
import { OpenAIEmbeddings } from "@langchain/openai";
import { CacheBackedEmbeddings } from "@langchain/community/embeddings/cache_backed";

// Create a Redis store for caching
const redisStore = new RedisStore({
  redisUrl: "redis://localhost:6379",
  namespace: "embeddings-cache"
});

// Underlying embeddings model
const underlyingEmbeddings = new OpenAIEmbeddings();

// Create cache-backed embeddings
const embeddings = CacheBackedEmbeddings.fromBytesStore(
  underlyingEmbeddings,
  redisStore,
  {
    namespace: underlyingEmbeddings.modelName
  }
);

// Use as regular embeddings - results will be cached in Redis
const vectors = await embeddings.embedDocuments([
  "Hello world",
  "LangChain is awesome"
]);
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

ISC 