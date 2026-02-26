const express = require('express');
const codeSubmitRouter = express.Router();
const { submitCode, runCode } = require('../controllers/submissionController');
const userMiddleware = require('../middleware/userMiddleware');
<<<<<<< HEAD
const { getSubmissions } = require('../controllers/submissionController');

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);
=======

codeSubmitRouter.post('/submit/:problemId', userMiddleware, submitCode);
codeSubmitRouter.post('/run/:problemId', userMiddleware, runCode);
<<<<<<< HEAD
codeSubmitRouter.get('/submissions/:problemId', userMiddleware, getSubmissions);
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03

module.exports = codeSubmitRouter;
