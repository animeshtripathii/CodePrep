const app = require("./app");
const connectDB = require('./config/db');
const redisClient = require('./config/redis');

// Database connection logic
connectDB().catch(console.error);

// Redis connection - use the existing client
if (!redisClient.isOpen) {
  redisClient.connect()
    .then(() => console.log("Connected to Redis"))
    .catch(err => console.error("Redis Error:", err.message));
}

// IMPORTANT: Do NOT use httpServer.listen() for Vercel.
// Export the app for Vercel's engine to pick up.
module.exports = app;