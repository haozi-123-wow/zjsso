const Redis = require('ioredis');
const config = require('../config');

let redisClient = null;

function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      connectTimeout: 10000,
      retryStrategy(times) {
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
      maxRetriesPerRequest: null
    });

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err.message);
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }
  return redisClient;
}

async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

module.exports = {
  getRedisClient,
  closeRedis
};
