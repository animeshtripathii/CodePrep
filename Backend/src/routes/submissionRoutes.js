const express = require('express');
const codeSubmitRouter = express.Router();
const { submitCode, runCode } = require('../controllers/submissionController');
const userMiddleware = require('../middleware/userMiddleware');
const { getSubmissions } = require('../controllers/submissionController');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);

module.exports = codeSubmitRouter;
