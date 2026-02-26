const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/discussionController');
const userMiddleware = require('../middleware/userMiddleware');
// Ensure the user is authenticated before reading history

router.get('/history/:roomId', userMiddleware, getChatHistory);

module.exports = router;
