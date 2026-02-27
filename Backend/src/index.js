const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require("./app");
const connectDB = require('./config/db');
const redisClient = require('./config/redis');
const http = require('http');
const { initSocketServer } = require('./sockets/chatHandler');


connectDB().catch(console.error);

if (!redisClient.isOpen) {
  redisClient.connect()
    .then(() => console.log("Connected to Redis successfully (Vercel/Local)"))
    .catch(err => console.error("Redis Connection Error:", err.message));
}
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
