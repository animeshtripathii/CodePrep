const problemModel = require('../models/problem.model');
const User = require('../models/user.model');
const { getLanguageId, submitBatch, submitToken } = require('../utils/problemSubmission.util');

/**
 * Validates all reference solutions against visible test cases using Judge0
 * @throws Error with descriptive message if any solution fails
 */
const validateReferenceSolutions = async (problemData) => {
    const { referenceSolution, visibleTestCases } = problemData;
    for (const sol of referenceSolution) {
        const language = sol.language;
        const completeCode = sol.completeCode;
        const languageId = getLanguageId(language);

        if (!languageId) {
            throw { status: 400, message: `Unsupported language: ${language}` };
        }

        const submission = visibleTestCases.map((testCase) => ({
            source_code: completeCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output
        }));

        const submitResult = await submitBatch(submission);
        console.log("Submission Result for reference solution:", submitResult);

        if (!Array.isArray(submitResult)) {
            throw { status: 400, message: "Submission failed at Judge0", details: submitResult };
        }

        const resultToken = submitResult.map((r) => r.token);
        const testResult = await submitToken(resultToken);
        console.log("Test Result for reference solution:", testResult);

        for (const result of testResult) {
            switch (result.status.id) {
                case 3:
                    continue; // Accepted
                case 4:
                    throw { status: 400, message: "Wrong Answer in reference solution" };
                case 5:
                    throw { status: 400, message: "Time Limit Exceeded in reference solution" };
                case 6:
                    throw { status: 400, message: "Compilation Error in reference solution" };
                default:
                    if (result.status.id > 6) {
                        throw { status: 400, message: `Runtime Error (${result.status.description}) in reference solution` };
                    }
                    throw { status: 400, message: "Unknown error in reference solution" };
            }
        }
    }
};

const createProblemInDB = async (problemData, creatorId) => {
    return await problemModel.create({
        ...problemData,
        problemCreator: creatorId
    });
};

const findProblemById = async (problemId, selectFields = '') => {
    if (selectFields) {
        return await problemModel.findById(problemId).select(selectFields);
    }
    return await problemModel.findById(problemId);
};

const updateProblemById = async (problemId, updateData) => {
    return await problemModel.findByIdAndUpdate(problemId, {
        ...updateData
    }, { runValidators: true, new: true });
};

const deleteProblemById = async (problemId) => {
    return await problemModel.findByIdAndDelete(problemId);
};

const getPaginatedProblems = async ({ page = 1, limit = 10, search = '' }) => {
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    const allProblem = await problemModel.find(query)
        .select('title description tags difficulty')
        .skip(skip)
        .limit(limit);

    const totalProblems = await problemModel.countDocuments(query);

    return {
        problems: allProblem,
        currentPage: page,
        totalPages: Math.ceil(totalProblems / limit),
        totalProblems
    };
};

const getUserSolvedProblems = async (userId) => {
    const user = await User.findById(userId).populate('problemSolved', '_id title description tags difficulty');
    return user.problemSolved;
};

module.exports = {
    validateReferenceSolutions,
    createProblemInDB,
    findProblemById,
    updateProblemById,
    deleteProblemById,
    getPaginatedProblems,
    getUserSolvedProblems
};
