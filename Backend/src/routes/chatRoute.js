const express = require('express')
const chatRouter = express.Router();
<<<<<<< HEAD
const { codingChat, websiteChat, interviewChat } = require('../controllers/chatController');
=======
const { codingChat, websiteChat } = require('../controllers/chatController');
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532
const userMiddleware = require('../middleware/userMiddleware');

chatRouter.post('/coding', userMiddleware, codingChat);
chatRouter.post('/website', userMiddleware, websiteChat);
<<<<<<< HEAD
chatRouter.post('/interview', userMiddleware, interviewChat);
=======
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532

module.exports = chatRouter;
