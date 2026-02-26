const express = require('express');
const codeSubmitRouter = express.Router();
const { submitCode, runCode, getSubmissions } = require('../controllers/submissionController');
const userMiddleware = require('../middleware/userMiddleware');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);

module.exports = codeSubmitRouter;
