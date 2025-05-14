import { BaseStore } from "@langchain/core/stores";
import Redis, { RedisOptions } from "ioredis";

/**
 * Interface for RedisStore configuration
 */
export interface RedisStoreConfig {
  /**
   * Redis client instance
   */
  client?: Redis;
  
  /**
   * Redis connection URL
   */
  redisUrl?: string;
  
  /**
   * Redis client configuration options
   */
  clientOptions?: RedisOptions;
  
  /**
   * Time to expire keys in seconds, if not provided keys will never expire
   */
  ttl?: number | null;
  
  /**
   * Namespace to prefix all keys
   */
  namespace?: string;
}

/**
 * Class for storing key-value pairs in Redis.
 * @extends BaseStore
 */
export class RedisStore extends BaseStore<string, Uint8Array> {
  static lc_name() {
    return "RedisStore";
  }

  public readonly lc_namespace = ["langchain", "stores", "redis"];
  
  private client: Redis;
  private ttl: number | null;
  private namespace: string;

  /**
   * Creates a new RedisStore instance
   * @param config - Configuration for the RedisStore
   */
  constructor(config: RedisStoreConfig = {}) {
    super();
    const {
      client,
      redisUrl,
      clientOptions = {},
      ttl = null,
      namespace = "",
    } = config;

    if (!client && !redisUrl) {
      throw new Error("Either a client or redisUrl must be provided");
    }

    this.client = client || new Redis(redisUrl!, clientOptions);
    this.ttl = ttl;
    this.namespace = namespace;
  }

  /**
   * Adds namespace prefix to a key if namespace is set
   * @param key - The key to prefix
   * @returns The prefixed key
   * @private
   */
  private _prefixKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }

  /**
   * Get multiple values from Redis
   * @param keys - Array of keys to get
   * @returns Values associated with the keys or undefined if not found
   */
  async mget(keys: string[]): Promise<(Uint8Array | undefined)[]> {
    const prefixedKeys = keys.map((key) => this._prefixKey(key));
    const response = await this.client.mget(prefixedKeys);
    
    return response.map((value) => {
      if (value === null) return undefined;
      return Buffer.from(value, "binary");
    });
  }

  /**
   * Set multiple keys and values in Redis
   * @param keyValuePairs - Array of key-value pairs to set
   * @returns Promise that resolves when operation is complete
   */
  async mset(keyValuePairs: [string, Uint8Array][]): Promise<void> {
    if (keyValuePairs.length === 0) return;

    const pipeline = this.client.pipeline();
    
    for (const [key, value] of keyValuePairs) {
      const prefixedKey = this._prefixKey(key);
      
      const buffer = Buffer.from(value);
      
      if (this.ttl) {
        pipeline.set(prefixedKey, buffer, "EX", this.ttl);
      } else {
        pipeline.set(prefixedKey, buffer);
      }
    }
    
    await pipeline.exec();
  }

  /**
   * Delete multiple keys from Redis
   * @param keys - Array of keys to delete
   * @returns Promise that resolves when operation is complete
   */
  async mdelete(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    
    const prefixedKeys = keys.map((key) => this._prefixKey(key));
    await this.client.del(...prefixedKeys);
  }

  /**
   * Yields keys in the store, optionally filtered by prefix
   * @param prefix - Optional prefix to filter keys
   * @returns Async generator that yields keys
   */
  async *yieldKeys(prefix?: string): AsyncGenerator<string> {
    let fullPrefix = this.namespace ? `${this.namespace}:` : "";
    let pattern = `${fullPrefix}*`;
    
    if (prefix) {
      pattern = `${fullPrefix}${prefix}*`;
    }
    
    let cursor = "0";
    
    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      
      cursor = nextCursor;
      
      for (const key of keys) {
        if (this.namespace && key.startsWith(`${this.namespace}:`)) {
          yield key.substring(this.namespace.length + 1);
        } else {
          yield key;
        }
      }
      
    } while (cursor !== "0");
  }
  
  /**
   * Close the Redis connection
   * @returns Promise that resolves when the connection is closed
   */
  async close(): Promise<void> {
    await this.client.quit();
  }
} 