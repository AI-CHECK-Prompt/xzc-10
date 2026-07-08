import { RedisClientOptions } from 'redis';

export const redisConfig: RedisClientOptions = {
  socket: {
    host: 'localhost',
    port: 6379,
  },
};

export const cacheConfig = {
  ttl: 3600,
};
