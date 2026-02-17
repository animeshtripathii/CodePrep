const problemService = require("../services/problem.service");

const createProblem = async (req, res) => {
    const {title, difficulty,description,tags, visibleTestCases,hiddenTestCases,startCode,referenceSolution } = req.body;

    try {
        // Validate reference solutions against Judge0
        await problemService.validateReferenceSolutions(req.body);

        // Create problem in DB
        await problemService.createProblemInDB(req.body, req.result._id);

        res.status(201).json({ message: "Problem created successfully" });
    } catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Internal Server Error",
            ...(error.details && { details: error.details })
        });
    }
};

const updateProblem = async (req, res) => {
    const problemId = req.params.id;
    const { title, difficulty, description, tags, visibleTestCases, hiddenTestCases, startCode, referenceSolution } = req.body;

    try {
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }

        const existingProblem = await problemService.findProblemById(problemId);
        if (!existingProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        // Validate reference solutions against Judge0
        await problemService.validateReferenceSolutions(req.body);

        // Update problem
        await problemService.updateProblemById(problemId, req.body);

        res.status(200).json({ message: "Problem updated successfully" });
    } catch (error) {
        const status = error.status || 500;
        res.status(status).json({
            message: error.message || "Internal Server Error",
            ...(error.details && { details: error.details })
        });
    }
};

const deleteProblem = async (req, res) => {
    const problemId = req.params.id;
    try {
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }

        const existingProblem = await problemService.findProblemById(problemId);
        if (!existingProblem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        await problemService.deleteProblemById(problemId);
        res.status(200).json({ message: "Problem deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getProblemById = async (req, res) => {
    const problemId = req.params.id;
    try {
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }

        const problem = await problemService.findProblemById(
            problemId,
            'title description tags difficulty visibleTestCases hiddenTestCases referenceSolution startCode'
        );

        if (!problem) {
            return res.status(404).json({ message: "Problem not found" });
        }

        res.status(200).json({ problem });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const getAllProblem = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const result = await problemService.getPaginatedProblems({ page, limit, search });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

const solvedAllProblemUser = async (req, res) => {
    try {
        const count = req.result.problemSolved.length;
        const userId = req.result._id;
        const solvedProblems = await problemService.getUserSolvedProblems(userId);

        return res.status(200).json({ count, user: solvedProblems });
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemUser };
