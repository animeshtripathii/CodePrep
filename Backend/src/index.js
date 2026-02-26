const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require("./app");
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const http = require('http');
const { initSocketServer } = require('./sockets/chatHandler');

const InitializeServer = async () => {
  try {
    await connectDB();
    await redisClient.connect();
    console.log("Connected to Redis successfully");
    console.log("Connected to MongoDB successfully");

    const PORT = process.env.PORT || 5000;

    const httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server Initialization Error:", err.message);
  }
};

InitializeServer();
