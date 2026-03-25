const problemModel = require("../models/problem");
const submissionModel = require("../models/submission");
const { getLanguageId, submitBatch, submitToken } = require("../utils/problemSubmissionUtility");
const { submissionQueue, queueEvents } = require("../queues/submissionQueue");

const processCodeSubmission = async (userId, problemId, code, language, reqResult, options = {}) => {
    if (!code || !language || !problemId || !userId) {
        throw new Error("Some required fields are missing");
    }

    const problem = await problemModel.findById(problemId);

    const submittedResult = await submissionModel.create({
        userId,
        problemId,
        code,
        language,
        status: "pending",
        testCasesTotal: problem.hiddenTestCases.length,
    });

    // Add to BullMQ Queue
    const job = await submissionQueue.add("code-submissions", {
        userId,
        problemId,
        code,
        language,
        submissionId: submittedResult._id,
        skipDriverCode: !!options.skipDriverCode
    });

    // Wait for the worker to finish processing the Judge0 requests
    const result = await job.waitUntilFinished(queueEvents);

    return result; // Result returned natively from worker after completion
};

const executeCode = async (userId, problemId, code, language, options = {}) => {
    if (!code || !language || !problemId || !userId) {
        throw new Error("Some required fields are missing");
    }

    const problem = await problemModel.findById(problemId);

    const languageId = getLanguageId(language);
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }

    let finalCode = code;
    if (!options.skipDriverCode && problem.driverCode && problem.driverCode.length > 0) {
        const driver = problem.driverCode.find(dc => dc.language.toLowerCase() === language.toLowerCase());
        if (driver && driver.code && driver.code.includes("{{USER_CODE}}")) {
            finalCode = driver.code.replace("{{USER_CODE}}", code);
        }
    }

    const submission = problem.visibleTestCases.map((testCase) => ({
        source_code: finalCode,
        language_id: languageId,
        stdin: testCase.input,
        expected_output: testCase.output,
    }));

    const submitResult = await submitBatch(submission);
    if (!Array.isArray(submitResult)) {
        throw new Error("Submission failed at Judge0: " + JSON.stringify(submitResult));
    }

    const resultToken = submitResult.map((res) => res.token);
    const testResult = await submitToken(resultToken);

    if (!Array.isArray(testResult)) {
        throw new Error("Failed to retrieve results from Judge0: " + JSON.stringify(testResult));
    }

    return { testResult };
};

const getSubmissionsForProblem = async (userId, problemId) => {
    const submissions = await submissionModel.find({ userId, problemId }).sort({ createdAt: -1 });
    return submissions;
};

const getRecentSubmissionsForUser = async (userId, limit = 8) => {
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 25);

    const submissions = await submissionModel
        .find({ userId })
        .populate('problemId', 'title')
        .sort({ createdAt: -1 })
        .limit(safeLimit)
        .lean();

    return submissions.map((sub) => ({
        _id: sub._id,
        problemTitle: sub.problemId?.title || 'Unknown Problem',
        status: sub.status,
        runtime: sub.runtime,
        memory: sub.memory,
        language: sub.language,
        createdAt: sub.createdAt
    }));
};

module.exports = {
    processCodeSubmission,
    executeCode,
    getSubmissionsForProblem,
    getRecentSubmissionsForUser
};
