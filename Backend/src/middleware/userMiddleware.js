const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

const userMiddleware = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            return res.status(401).json({ message: 'Login or Signup required' });
        }

        // 1. Verify JWT immediately
        const payload = jwt.verify(token, process.env.JWT_Secret_Key);
        const { _id } = payload;

        if (!_id) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        // 2. Fetch User from DB
        const result = await User.findById(_id);
        if (!result) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 3. Serverless-Safe Redis Check
        // Only check blacklist if Redis is actually connected to avoid timeouts
        if (redisClient.isOpen) {
            try {
                const isBlocked = await redisClient.exists(`token:${token}`);
                if (isBlocked) {
                    return res.status(401).json({ message: 'Session expired. Please login again.' });
                }
            } catch (redisErr) {
                console.error("Non-critical Redis Error in Middleware:", redisErr.message);
                // We don't block the user if Redis is temporarily down/slow in serverless
            }
        }

        req.result = result;
        next();
    } catch (error) {
        console.error("Middleware Error:", error.message);
        res.status(401).json({ message: error.message || 'Authentication failed' });
    }
};

module.exports = userMiddleware;