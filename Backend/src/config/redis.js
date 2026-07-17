const { createClient } = require('redis');

// Render's built-in Redis addon provides a single REDIS_URL.
// Fallback to individual REDIS_HOST / REDIS_PORT / REDIS_PASSWORD vars
// (used by RedisLabs / Upstash / custom setups).
const redisClient = process.env.REDIS_URL
  ? createClient({ url: process.env.REDIS_URL })
  : createClient({
      username: 'default',
      password: process.env.REDIS_PASSWORD,
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

module.exports = redisClient;



