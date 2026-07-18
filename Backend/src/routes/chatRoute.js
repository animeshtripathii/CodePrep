const express = require('express')
const chatRouter = express.Router();
const { codingChat, websiteChat, interviewChat } = require('../controllers/chatController');
const userMiddleware = require('../middleware/userMiddleware');

chatRouter.post('/coding', userMiddleware, codingChat);
chatRouter.post('/website', userMiddleware, websiteChat);
chatRouter.post('/interview', userMiddleware, interviewChat);

module.exports = chatRouter;
