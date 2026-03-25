const express = require('express');
const codeSubmitRouter = express.Router();
const { submitCode, runCode, getSubmissions, getRecentSubmissions, analyzeComplexity } = require('../controllers/submissionController');
const userMiddleware = require('../middleware/userMiddleware');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
codeSubmitRouter.get('/recent', userMiddleware, getRecentSubmissions);
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);
codeSubmitRouter.post('/analyze', userMiddleware, analyzeComplexity);

module.exports = codeSubmitRouter;
