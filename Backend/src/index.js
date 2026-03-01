require('dotenv').config();
const app = require("./app");
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const http = require('http');
const { initSocketServer } = require('./sockets/chatHandler');

const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    await connectDB();
    if (!redisClient.isOpen) await redisClient.connect();
    console.log("Redis connected successfully");
    const httpServer = http.createServer(app);
    initSocketServer(httpServer); 

    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

startServer();
