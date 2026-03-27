const problemModel = require("../models/problem");
const submissionModel = require("../models/submission");
const { getLanguageId, submitBatch, submitToken } = require("../utils/problemSubmissionUtility");
const { submissionQueue, queueEvents } = require("../queues/submissionQueue");

const processCodeSubmission = async (userId, problemId, code, language, reqResult, options = {}) => {
    console.log("[SubmissionService] processCodeSubmission start", {
        userId: String(userId),
        problemId: String(problemId),
        language,
        skipDriverCode: !!options.skipDriverCode
    });

    if (!code || !language || !problemId || !userId) {
        throw new Error("Some required fields are missing");
    }

    const problem = await problemModel.findById(problemId);

    if (!problem) {
        throw new Error("Problem not found");
    }

    console.log("[SubmissionService] problem loaded", {
        problemId: String(problemId),
        hiddenTestCasesCount: problem?.hiddenTestCases?.length || 0
    });

    const submittedResult = await submissionModel.create({
        userId,
        problemId,
        code,
        language,
        status: "pending",
        testCasesTotal: problem.hiddenTestCases.length,
    });

    console.log("[SubmissionService] submission document created", {
        submissionId: String(submittedResult._id),
        status: submittedResult.status
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

    console.log("[SubmissionService] queue job added", {
        jobId: String(job.id),
        submissionId: String(submittedResult._id)
    });

    // Wait for the worker to finish processing the Judge0 requests
    const result = await job.waitUntilFinished(queueEvents);

    console.log("[SubmissionService] queue job finished", {
        jobId: String(job.id),
        submissionId: String(submittedResult._id),
        finalStatus: result?.submission?.status || null
    });

    return result; // Result returned natively from worker after completion
};

const executeCode = async (userId, problemId, code, language, options = {}) => {
    console.log("[SubmissionService] executeCode start", {
        userId: String(userId),
        problemId: String(problemId),
        language,
        skipDriverCode: !!options.skipDriverCode
    });

    if (!code || !language || !problemId || !userId) {
        throw new Error("Some required fields are missing");
    }

    const problem = await problemModel.findById(problemId);

    if (!problem) {
        throw new Error("Problem not found");
    }

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

    console.log("[SubmissionService] submitBatch success", {
        problemId: String(problemId),
        submissionCount: submitResult.length
    });

    const resultToken = submitResult.map((res) => res?.token).filter(Boolean);
    if (resultToken.length !== submitResult.length) {
        throw new Error("Judge0 did not return valid submission tokens");
    }
    const testResult = await submitToken(resultToken);

    if (!Array.isArray(testResult)) {
        throw new Error("Failed to retrieve results from Judge0: " + JSON.stringify(testResult));
    }

    console.log("[SubmissionService] submitToken success", {
        problemId: String(problemId),
        tokenCount: resultToken.length,
        resultCount: testResult.length
    });

    return { testResult };
};

const getSubmissionsForProblem = async (userId, problemId) => {
    console.log("[SubmissionService] getSubmissionsForProblem", {
        userId: String(userId),
        problemId: String(problemId)
    });

    const submissions = await submissionModel.find({ userId, problemId }).sort({ createdAt: -1 });

    console.log("[SubmissionService] getSubmissionsForProblem success", {
        userId: String(userId),
        problemId: String(problemId),
        count: submissions.length
    });

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
