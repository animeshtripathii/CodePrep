const express = require('express');
const router = express.Router();
const VideoSolution = require('../models/videoSolution');
const adminMiddleware = require('../middleware/adminMiddleware');
const videoRouter=express.Router();
const { generateUploadSignature, saveVideoMetadata,deleteVideo} = require('../controllers/videoController');

videoRouter.get("/create",adminMiddleware,generateUploadSignature);
videoRouter.post("/save",adminMiddleware,saveVideoMetadata);
videoRouter.delete("/delete/:problemId",adminMiddleware,deleteVideo);

module.exports=videoRouter;