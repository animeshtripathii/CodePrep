const express = require('express');
const codeSubmitRouter = express.Router();
const { submitCode, runCode } = require('../controllers/submissionController');
const userMiddleware = require('../middleware/userMiddleware');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);

module.exports = codeSubmitRouter;
