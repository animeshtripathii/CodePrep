const express = require('express');
const codeSubmitRouter = express.Router();
<<<<<<< HEAD
const { submitCode, runCode, getSubmissions } = require('../controllers/submissionController');
=======
const { submitCode, runCode } = require('../controllers/submissionController');
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
const userMiddleware = require('../middleware/userMiddleware');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
<<<<<<< HEAD
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1

module.exports = codeSubmitRouter;
