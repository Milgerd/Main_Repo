const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    reconnectStrategy: (retries) => {
      if (retries > 5) return false;
      return Math.min(retries * 200, 2000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisClient.on('ready', () => {
  console.log('Redis connected successfully');
});

async function connectRedis() {
  try {
    await redisClient.connect();
    return true;
  } catch (err) {
    console.warn('Redis unavailable — starting without cache:', err.message);
    return false;
  }
}

module.exports = { redisClient, connectRedis };
