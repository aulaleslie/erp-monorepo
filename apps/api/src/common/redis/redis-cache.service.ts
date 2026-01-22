import { Injectable, Logger, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (data) {
        this.logger.log(`CACHE HIT: ${key}`);
        return JSON.parse(data) as T;
      }
      this.logger.log(`CACHE MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(
        `Error reading from cache: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serializedValue);
    } catch (error) {
      this.logger.error(
        `Error setting cache: ${key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        if (key.length > 0) {
          await this.redis.del(...key);
        }
      } else {
        await this.redis.del(key);
      }
    } catch (error) {
      this.logger.error(
        `Error deleting from cache: ${Array.isArray(key) ? key.join(', ') : key}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async delByPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(
        `Error deleting by pattern: ${pattern}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
