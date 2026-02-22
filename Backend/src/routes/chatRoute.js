const express = require('express')
const chatRouter = express.Router();
const { codingChat, websiteChat } = require('../controllers/chatController');
const userMiddleware = require('../middleware/userMiddleware');

chatRouter.post('/coding', userMiddleware, codingChat);
chatRouter.post('/website', userMiddleware, websiteChat);

module.exports = chatRouter;
