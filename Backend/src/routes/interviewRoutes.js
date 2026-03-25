const express = require('express');
const interviewRouter = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temporary storage for parsed files
const { startSession, flagSession, endSession, uploadCV, generateReport } = require('../controllers/interviewController');
const userMiddleware = require('../middleware/userMiddleware');

interviewRouter.post('/start', userMiddleware, startSession);
interviewRouter.post('/flag', userMiddleware, flagSession);
interviewRouter.post('/end', userMiddleware, endSession);
interviewRouter.post('/upload-cv', userMiddleware, upload.single('cvFile'), uploadCV);

// Endpoint to generate final interview report
interviewRouter.post('/generate-report', userMiddleware, generateReport);

module.exports = interviewRouter;
