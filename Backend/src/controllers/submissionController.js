const submissionService = require('../services/submissionService');

const submitCode = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;
        const { code, language } = req.body;

        const result = await submissionService.processCodeSubmission(userId, problemId, code, language, req.result);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error submitting code:", error);
        if (error.message.includes("Some required fields are missing") || error.message.includes("Unsupported language")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const runCode = async (req, res) => {
    console.log("Received run code request with body:", req.body);
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;
        const { code, language } = req.body;

        const result = await submissionService.executeCode(userId, problemId, code, language);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error submitting code:", error);
        if (error.message.includes("Some required fields are missing") || error.message.includes("Unsupported language")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const userId = req.result._id;
        const problemId = req.params.problemId;
        const submissions = await submissionService.getSubmissionsForProblem(userId, problemId);
        res.status(200).json(submissions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { submitCode, runCode, getSubmissions };
