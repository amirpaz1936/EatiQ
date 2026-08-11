import { Inject, Injectable, Logger } from "@nestjs/common";
import Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import type { SuggestionsResult } from "./schema";

export const SUGGESTIONS_CACHE_TTL_SECONDS = 2 * 60 * 60; // 2 hours

/**
 * Read/write/invalidate for cached meal suggestions.
 *
 * Invalidation lives here rather than inside SuggestionsService because the inputs
 * that make a cached suggestion wrong are owned by *other* modules: editing the
 * profile's avoid-list or refreshing feedback insights both have to drop the cache,
 * otherwise a newly-avoided ingredient keeps being suggested until the TTL expires.
 */
@Injectable()
export class SuggestionsCacheService {
  private readonly logger = new Logger(SuggestionsCacheService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<SuggestionsResult | null> {
    try {
      const raw = await this.redis.get(key);
      return raw ? (JSON.parse(raw) as SuggestionsResult) : null;
    } catch (err) {
      this.logger.warn(`Redis GET failed for ${key}: ${(err as Error).message}`);
      return null;
    }
  }

  async set(key: string, value: SuggestionsResult): Promise<void> {
    try {
      await this.redis.set(
        key,
        JSON.stringify(value),
        "EX",
        SUGGESTIONS_CACHE_TTL_SECONDS,
      );
    } catch (err) {
      this.logger.warn(`Redis SET failed for ${key}: ${(err as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Redis DEL failed for ${key}: ${(err as Error).message}`);
    }
  }

  /** Drops every cached slot/language combination for one user. */
  async invalidateForUser(userId: string): Promise<void> {
    const pattern = `suggestions:${userId}:*`;
    try {
      const keys: string[] = [];
      for await (const batch of this.redis.scanStream({
        match: pattern,
        count: 100,
      })) {
        keys.push(...(batch as string[]));
      }
      if (keys.length > 0) {
        await this.redis.del(...keys);
        this.logger.log(
          `invalidated ${keys.length} suggestion cache key(s) for ${userId}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `suggestion cache invalidation failed for ${userId}: ${(err as Error).message}`,
      );
    }
  }
}
