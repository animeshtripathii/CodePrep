const problemModel = require('../models/problem');
const User = require('../models/user');
const Video = require('../models/videoSolution');
const { getLanguageId, submitBatch, submitToken } = require('../utils/problemSubmissionUtility');

const createNewProblem = async (problemData, userId) => {
    const { title, description, tags, difficulty, visibleTestCases, hiddenTestCases, startCode, referenceSolution } = problemData;

    for (const sol of referenceSolution) {
        const language = sol.language;
        const completeCode = sol.completeCode;
        const languageId = getLanguageId(language);

        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }

        let finalCode = completeCode;
        if (problemData.driverCode && problemData.driverCode.length > 0) {
            const driver = problemData.driverCode.find(dc => dc.language.toLowerCase() === language.toLowerCase());
            if (driver && driver.code && driver.code.includes('{{USER_CODE}}')) {
                finalCode = driver.code.replace('{{USER_CODE}}', completeCode);
            }
        }

        const submission = visibleTestCases.map((testCase) => ({
            source_code: finalCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output
        }));

        const submitResult = await submitBatch(submission);
        console.log("Submission Result for reference solution:", submitResult);

        if (!Array.isArray(submitResult)) {
            throw new Error("Submission failed at Judge0: " + JSON.stringify(submitResult));
        }

        const resultToken = submitResult.map((res) => res.token);
        const testResult = await submitToken(resultToken);
        console.log("Test Result for reference solution:", testResult);

        for (const result of testResult) {
            switch (result.status.id) {
                case 3:
                    continue; // Accepted
                case 4:
                    throw new Error("Wrong Answer in reference solution");
                case 5:
                    throw new Error("Time Limit Exceeded in reference solution");
                case 6:
                    throw new Error("Compilation Error in reference solution");
                default:
                    if (result.status.id > 6) {
                        throw new Error(`Runtime Error (${result.status.description}) in reference solution`);
                    }
                    throw new Error("Unknown error in reference solution");
            }
        }
    }

    const userProblem = await problemModel.create({
        ...problemData,
        problemCreator: userId
    });

    return userProblem;
};

const updateExistingProblem = async (problemId, problemData) => {
    const { title, description, tags, difficulty, visibleTestCases, hiddenTestCases, startCode, referenceSolution, problemCreator } = problemData;

    const DsaProblem = await problemModel.findById(problemId);
    if (!DsaProblem) {
        throw new Error("Problem not found");
    }

    for (const sol of referenceSolution) {
        const language = sol.language;
        const completeCode = sol.completeCode;
        const languageId = getLanguageId(language);

        if (!languageId) {
            throw new Error(`Unsupported language: ${language}`);
        }

        let finalCode = completeCode;
        if (problemData.driverCode && problemData.driverCode.length > 0) {
            const driver = problemData.driverCode.find(dc => dc.language.toLowerCase() === language.toLowerCase());
            if (driver && driver.code && driver.code.includes('{{USER_CODE}}')) {
                finalCode = driver.code.replace('{{USER_CODE}}', completeCode);
            }
        }

        const submission = visibleTestCases.map((testCase) => ({
            source_code: finalCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output
        }));

        const submitResult = await submitBatch(submission);
        console.log("Submission Result for reference solution:", submitResult);

        if (!Array.isArray(submitResult)) {
            throw new Error("Submission failed at Judge0: " + JSON.stringify(submitResult));
        }

        const resultToken = submitResult.map((res) => res.token);
        const testResult = await submitToken(resultToken);
        console.log("Test Result for reference solution:", testResult);

        for (const result of testResult) {
            switch (result.status.id) {
                case 3:
                    continue; // Accepted
                case 4:
                    throw new Error("Wrong Answer in reference solution");
                case 5:
                    throw new Error("Time Limit Exceeded in reference solution");
                case 6:
                    throw new Error("Compilation Error in reference solution");
                default:
                    if (result.status.id > 6) {
                        throw new Error(`Runtime Error (${result.status.description}) in reference solution`);
                    }
                    throw new Error("Unknown error in reference solution");
            }
        }
    }

    const newProblem = await problemModel.findByIdAndUpdate(problemId, {
        ...problemData
    }, { runValidators: true, new: true });

    return newProblem;
};

const deleteProblemById = async (problemId) => {
    const DsaProblem = await problemModel.findById(problemId);
    if (!DsaProblem) {
        throw new Error("Problem not found");
    }
    await problemModel.findByIdAndDelete(problemId);
};

const getProblem = async (problemId) => {
    const DsaProblem = await problemModel.findById(problemId).select('title description tags difficulty visibleTestCases hiddenTestCases referenceSolution startCode videoUrl').lean();

    if (!DsaProblem) {
        throw new Error("Problem not found");
    }

    // Fetch video for this problem
    const video = await Video.findOne({ problemId: problemId });
    if (video) {
        DsaProblem.secureUrl = video.secureUrl;
        DsaProblem.thumbnailUrl = video.thumbnailUrl;
        DsaProblem.duration = video.duration;
        DsaProblem.cloudinaryPublicId = video.cloudinaryPublicId;
    }
    return DsaProblem;
};

const getAllProblems = async (queryData) => {
    const page = parseInt(queryData.page) || 1;
    const limit = parseInt(queryData.limit) || 10;
    const search = queryData.search || '';
    const difficulty = queryData.difficulty || '';
    const tag = queryData.tag || '';
    const skip = (page - 1) * limit;

    const query = {};

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    if (difficulty) {
        query.difficulty = { $regex: `^${difficulty}$`, $options: 'i' };
    }

    if (tag) {
        query.tags = { $in: [tag] };
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

const getSolvedProblems = async (userId) => {
    const user = await User.findByIdAndUpdate(userId).populate('problemSolved', '_id title description tags difficulty');
    return {
        count: user.problemSolved.length,
        user: user.problemSolved
    };
};

module.exports = {
    createNewProblem,
    updateExistingProblem,
    deleteProblemById,
    getProblem,
    getAllProblems,
    getSolvedProblems
};
