const express=require('express');
const codeSubmitRouter=express.Router();
const {submitCode,runCode}=require('../controllers/codeSubmission.controller');
const userMiddleware=require('../middlewares/user.middleware');

codeSubmitRouter.post('/submit/:problemId',userMiddleware,submitCode);
codeSubmitRouter.post('/run/:problemId',userMiddleware,runCode);

module.exports=codeSubmitRouter;
