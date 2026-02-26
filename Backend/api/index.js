const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = require('../src/app');
const connectDB = require('../src/config/db');
const redisClient = require('../src/config/redis');

// Cache the connection promise so we don't reconnect on every request
let isConnected = false;

const connectServices = async () => {
    if (isConnected) return;
    try {
        await connectDB();
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        isConnected = true;
        console.log("Connected to MongoDB and Redis (Vercel serverless)");
    } catch (err) {
        console.error("Connection error:", err.message);
        throw err;
    }
};

// Wrap the Express app for Vercel serverless
module.exports = async (req, res) => {
    await connectServices();
    return app(req, res);
};
