const InterviewSession = require('../models/InterviewSession');
const Problem = require('../models/problem');
const User = require('../models/user');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const startSession = async (req, res) => {
    try {
        const userId = req.result._id;

        // Auto-complete any existing active sessions
        await InterviewSession.updateMany(
            { userId, status: 'active' },
            { $set: { status: 'completed', endTime: new Date() } }
        );

        // Pick a random problem (could be filtered by difficulty if requested)
        const count = await Problem.countDocuments();
        const random = Math.floor(Math.random() * count);
        const randomProblem = await Problem.findOne().skip(random);

        if (!randomProblem) {
            return res.status(404).json({ message: "No problems found to start interview." });
        }

        const session = await InterviewSession.create({
            userId,
            problemId: randomProblem._id
        });

        res.status(201).json({
            message: "Interview started",
            session,
            problemId: randomProblem._id
        });
    } catch (error) {
        console.error("Error starting interview session:", error);
        res.status(500).json({ message: error.message });
    }
};

const flagSession = async (req, res) => {
    try {
        const userId = req.result._id;
        const { sessionId } = req.body;

        const session = await InterviewSession.findOne({ _id: sessionId, userId, status: 'active' });

        if (!session) {
            return res.status(404).json({ message: "Active session not found." });
        }

        session.tabSwitchCount += 1;
        if (session.tabSwitchCount >= 3) {
            session.status = 'flagged';
        }
        await session.save();

        res.status(200).json({
            message: "Session flagged",
            tabSwitchCount: session.tabSwitchCount,
            status: session.status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const endSession = async (req, res) => {
    try {
        const userId = req.result._id;
        const { sessionId } = req.body;

        const session = await InterviewSession.findOne({ _id: sessionId, userId, status: 'active' });

        if (!session) {
            return res.status(404).json({ message: "Active session not found." });
        }

        session.status = 'completed';
        session.endTime = new Date();
        await session.save();

        res.status(200).json({
            message: "Interview session ended successfully.",
            session
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const uploadCV = async (req, res) => {
    try {
        const userId = req.result?._id;
        const role = req.result?.role || 'user';

        if (role !== 'admin') {
            const userDoc = await User.findById(userId).select('aiMockInterviewCount');
            const currentCount = Number(userDoc?.aiMockInterviewCount || 0);
            if (currentCount >= 2) {
                return res.status(403).json({
                    message: "AI mock interview limit reached. You can use AI mock interview only 2 times.",
                    remainingAttempts: 0
                });
            }
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const filePath = req.file.path;
        const mimeType = req.file.mimetype;
        const extension = req.file.originalname.split('.').pop().toLowerCase();
        let extractedText = "";

        // Text files
        if (mimeType === 'text/plain' || extension === 'txt' || extension === 'md') {
            extractedText = fs.readFileSync(filePath, 'utf8');
        } 
        // PDF files
        else if (mimeType === 'application/pdf' || extension === 'pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            extractedText = pdfData.text;
        }  
        // Word files
        else if (
            mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            mimeType === 'application/msword' || 
            extension === 'docx' || 
            extension === 'doc'
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            extractedText = result.value;
        } else {
            // Cleanup and reject
            fs.unlinkSync(filePath);
            return res.status(400).json({ message: "Unsupported file type. Please upload PDF, DOCX, or TXT." });
        }

        // Cleanup temp file
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        let remainingAttempts = null;
        if (role !== 'admin') {
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $inc: { aiMockInterviewCount: 1 } },
                { returnDocument: 'after' }
            ).select('aiMockInterviewCount');
            remainingAttempts = Math.max(0, 2 - Number(updatedUser?.aiMockInterviewCount || 0));
        }

        return res.status(200).json({
            message: "CV parsed successfully",
            text: extractedText,
            remainingAttempts
        });

    } catch (error) {
        console.error("CV Upload Error:", error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({ message: "Failed to parse CV." });
    }
};

const generateReport = async (req, res) => {
    try {
        const { chatHistory, problemContext, cvContext } = req.body;
        
        if (!chatHistory || !Array.isArray(chatHistory)) {
            return res.status(400).json({ success: false, message: "Chat history missing or invalid array." });
        }

        const genAI = new GoogleGenerativeAI(process.env.ChatBot_API);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `You are a Senior Engineering Manager reviewing a candidate's mock interview transcript. 
You will be provided with the conversation history between the AI Interviewer and the Candidate.

Please generate a professional, structured Markdown feedback report grading the user's performance. Include:
1. **Executive Summary** (1-2 sentences)
2. **Strengths** (What they did well based on the transcript)
3. **Areas for Improvement** (Technical or communication weaknesses)
4. **Overall Score** (Out of 10)

Transcript Analysis Payload:
Problem Context: ${problemContext || 'Target Role / General Technical Interview'}
CV Details Provided: ${cvContext ? 'Yes' : 'No'}

Interview Transcript:
${chatHistory.map(msg => msg).join('\n')}

Output your response strictly as formatted Markdown so it can be directly rendered by a Markdown parser on the frontend.`;

        const response = await model.generateContent(systemPrompt);
        const feedbackText = response.response.text();

        res.json({ success: true, report: feedbackText });

    } catch (err) {
        console.error("AI Report Generation Error:", err);
        res.status(500).json({ success: false, message: "Failed to generate AI feedback report: " + err.message });
    }
};

module.exports = { startSession, flagSession, endSession, uploadCV, generateReport };
