import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis | null = null;
  private readonly defaultTtl: number;

  constructor(private readonly configService: ConfigService) {
    this.defaultTtl = this.configService.get<number>('REDIS_TTL', 300); // 5 minutes default
  }

  async onModuleInit() {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD');

      this.redis = new Redis({
        host,
        port,
        ...(password && { password }), // Only include password if provided
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn(
              'Redis connection failed after 3 retries, caching disabled',
              host,
            );
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000); // Exponential backoff
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      this.redis.on('error', (error) => {
        this.logger.error(`Redis connection error: ${error.message}`);
      });

      this.redis.on('connect', () => {
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });

      await this.redis.connect();
    } catch (error) {
      this.logger.warn('Failed to connect to Redis, caching will be disabled');
      this.logger.debug(
        `Redis connection error: ${error instanceof Error ? error.message : String(error)}`,
      );
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis connection closed');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(
        `Error getting cache key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null; // Graceful degradation
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      const ttlSeconds = ttl ?? this.defaultTtl;
      const serialized = JSON.stringify(value);
      await this.redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      this.logger.error(
        `Error setting cache key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false; // Graceful degradation
    }
  }

  /**
   * Delete a cache key
   */
  async delete(key: string): Promise<boolean> {
    if (!this.redis) {
      return false;
    }

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting cache key ${key}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Delete multiple keys matching a pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.redis) {
      return 0;
    }

    try {
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      let deletedCount = 0;
      const pipeline = this.redis.pipeline();

      stream.on('data', (keys: string[]) => {
        keys.forEach((key) => {
          pipeline.del(key);
          deletedCount++;
        });
      });

      return new Promise((resolve) => {
        stream.on('end', () => {
          if (deletedCount > 0) {
            pipeline
              .exec()
              .then(() => resolve(deletedCount))
              .catch((error) => {
                this.logger.error(
                  `Error deleting cache pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
                );
                resolve(deletedCount);
              });
          } else {
            resolve(deletedCount);
          }
        });
        stream.on('error', (error) => {
          this.logger.error(
            `Error deleting cache pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
          );
          resolve(0);
        });
      });
    } catch (error) {
      this.logger.error(
        `Error deleting cache pattern ${pattern}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return 0;
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }
}
