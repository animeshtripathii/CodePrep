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
<<<<<<< HEAD
    console.log("Received run code request with body:", req.body);
=======
<<<<<<< HEAD
    console.log("Received run code request with body:", req.body);
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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
<<<<<<< HEAD
=======
=======
module.exports = { submitCode, runCode };
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
