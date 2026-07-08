import { RedisClientOptions } from 'redis';

export const redisConfig: RedisClientOptions = {
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
  },
};

export const cacheConfig = {
  ttl: 3600,
};
