const submissionService = require('../services/submissionService');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.ChatBot_API });

const submitCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;
        const { code, language, interviewMode } = req.body;

        console.log("[SubmissionController] submitCode start", {
            userId: String(userId),
            problemId: String(problemId),
            language,
            interviewMode: !!interviewMode,
            codeLength: code ? code.length : 0
        });

        const result = await submissionService.processCodeSubmission(
            userId,
            problemId,
            code,
            language,
            req.result,
            { skipDriverCode: !!interviewMode }
        );

        console.log("[SubmissionController] submitCode success", {
            userId: String(userId),
            problemId: String(problemId),
            submissionId: result?.submission?._id ? String(result.submission._id) : null,
            status: result?.submission?.status || null
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error submitting code:", error);
        if (error.message.includes("Some required fields are missing") || error.message.includes("Unsupported language")) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === "Problem not found") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("Failed to retrieve results from Judge0") || error.message.includes("Submission failed at Judge0")) {
            return res.status(502).json({ message: "Judge0 service unavailable or returned an invalid response", error: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const runCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;
        const { code, language, interviewMode } = req.body;

        console.log("[SubmissionController] runCode start", {
            userId: String(userId),
            problemId: String(problemId),
            language,
            interviewMode: !!interviewMode,
            codeLength: code ? code.length : 0
        });

        const result = await submissionService.executeCode(userId, problemId, code, language, {
            skipDriverCode: !!interviewMode
        });

        console.log("[SubmissionController] runCode success", {
            userId: String(userId),
            problemId: String(problemId),
            testResultCount: Array.isArray(result?.testResult) ? result.testResult.length : 0
        });

        res.status(200).json(result);
    } catch (error) {
        console.error("Error submitting code:", error);
        if (error.message.includes("Some required fields are missing") || error.message.includes("Unsupported language")) {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === "Problem not found") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("Failed to retrieve results from Judge0") || error.message.includes("Submission failed at Judge0")) {
            return res.status(502).json({ message: "Judge0 service unavailable or returned an invalid response", error: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;

        console.log("[SubmissionController] getSubmissions start", {
            userId: String(userId),
            problemId: String(problemId)
        });

        const submissions = await submissionService.getSubmissionsForProblem(userId, problemId);

        console.log("[SubmissionController] getSubmissions success", {
            userId: String(userId),
            problemId: String(problemId),
            count: submissions.length
        });

        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecentSubmissions = async (req, res) => {
    try {
        const userId = req.result._id;
        const limit = req.query.limit;
        const submissions = await submissionService.getRecentSubmissionsForUser(userId, limit);
        res.status(200).json({ submissions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const analyzeComplexity = async (req, res) => {
    try {
        const { code, language } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Code is required" });
        }

        const prompt = `
Analyze the time and space complexity of the following ${language} code.
Return ONLY a valid JSON object with the following structure:
{
  "time": "Big O notation (e.g., O(N), O(N^2))",
  "space": "Big O notation (e.g., O(1), O(N))",
  "feedback": "A short 1-sentence explanation of the complexity and a hint if it can be optimized."
}

Code:
${code}`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        // Parse JSON from text, extracting from markdown block if present
        let jsonStr = response.text.trim();
        if (jsonStr.startsWith('\`\`\`json')) jsonStr = jsonStr.substring(7);
        else if (jsonStr.startsWith('\`\`\`')) jsonStr = jsonStr.substring(3);
        if (jsonStr.endsWith('\`\`\`')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);

        const analysis = JSON.parse(jsonStr.trim());
        res.status(200).json(analysis);
    } catch (error) {
        console.error("Error analyzing complexity:", error);
        res.status(500).json({ message: "Failed to analyze complexity", error: error.message });
    }
};

module.exports = { submitCode, runCode, getSubmissions, getRecentSubmissions, analyzeComplexity };
