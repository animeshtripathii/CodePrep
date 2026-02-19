const problemService = require('../services/problemService');

const createProblem = async (req, res) => {
    try {
        await problemService.createNewProblem(req.body, req.result._id);
        res.status(201).json({ message: "Problem created successfully" });
    } catch (error) {
        if (error.message.includes("Unsupported language") || error.message.includes("Wrong Answer") || error.message.includes("Time Limit") || error.message.includes("Compilation Error")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const updateProblem = async (req, res) => {
    try {
        const problemId = req.params.id;
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }
        await problemService.updateExistingProblem(problemId, req.body);
        res.status(200).json({ message: "Problem updated successfully" });
    } catch (error) {
        if (error.message === "Problem not found") {
            return res.status(404).json({ message: error.message });
        }
        if (error.message.includes("Unsupported language") || error.message.includes("Wrong Answer") || error.message.includes("Time Limit") || error.message.includes("Compilation Error")) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const deleteProblem = async (req, res) => {
    try {
        const problemId = req.params.id;
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }
        await problemService.deleteProblemById(problemId);
        res.status(200).json({ message: "Problem deleted successfully" });
    } catch (error) {
        if (error.message === "Problem not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const getProblemById = async (req, res) => {
    try {
        const problemId = req.params.id;
        if (!problemId) {
            return res.status(400).json({ message: "Problem ID is required" });
        }
        const problem = await problemService.getProblem(problemId);
        res.status(200).json({ problem });
    } catch (error) {
        if (error.message === "Problem not found") {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const getAllProblem = async (req, res) => {
    try {
        const result = await problemService.getAllProblems(req.query);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const solvedAllProblemUser = async (req, res) => {
    try {
        const userId = req.result._id;
        const result = await problemService.getSolvedProblems(userId);
        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = { createProblem, updateProblem, deleteProblem, getProblemById, getAllProblem, solvedAllProblemUser };
