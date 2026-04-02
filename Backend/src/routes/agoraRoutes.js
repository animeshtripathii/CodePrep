const express = require('express');
const router = express.Router();
const { generateAgoraToken } = require('../controllers/agoraTokenController');
const userMiddleware = require('../middleware/userMiddleware');

// POST /agora/token — requires authentication
router.post('/token', userMiddleware, generateAgoraToken);

module.exports = router;
