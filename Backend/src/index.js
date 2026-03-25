require('dotenv').config();
const app = require("./app");
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const http = require('http');
const { initSocketServer, getIo } = require('./sockets/chatHandler');
const { initMockInterviewSocket } = require('./sockets/mockInterviewHandler');
require('./workers/submissionWorker'); // Start BullMQ Worker
const PORT = process.env.PORT || 10000;
const HOST = process.env.HOST || '0.0.0.0';

async function startServer() {
  try {
    await connectDB();
    if (!redisClient.isOpen) await redisClient.connect();
    const httpServer = http.createServer(app);
    initSocketServer(httpServer);
    const io = getIo();
    initMockInterviewSocket(io);

    httpServer.listen(PORT, HOST, () => {
    });
  } catch (err) {
    console.error("Startup error:", err);
    process.exit(1);
  }
}

startServer();
