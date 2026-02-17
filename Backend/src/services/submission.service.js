const problemModel = require("../models/problem.model");
const submissionModel = require("../models/submission.model");
const { getLanguageId, submitBatch, submitToken } = require("../utils/problemSubmission.util");

/**
 * Creates a pending submission record in the database
 */
const createSubmissionRecord = async ({ userId, problemId, code, language, testCasesTotal }) => {
    return await submissionModel.create({
        userId,
        problemId,
        code,
        language,
        status: "pending",
        testCasesTotal,
    });
};

/**
 * Builds Judge0 submission payloads from test cases
 */
const buildSubmissionPayload = (code, languageId, testCases) => {
    return testCases.map((testCase) => ({
        source_code: code,
        language_id: languageId,
        stdin: testCase.input,
        expected_output: testCase.output,
    }));
};

/**
 * Submits code to Judge0 and returns raw test results
 * @throws Error with descriptive message on failure
 */
const executeOnJudge0 = async (submissions) => {
    const submitResult = await submitBatch(submissions);
    if (!Array.isArray(submitResult)) {
        throw { status: 400, message: "Submission failed at Judge0", details: submitResult };
    }

    const resultToken = submitResult.map((r) => r.token);
    const testResult = await submitToken(resultToken);

    if (!Array.isArray(testResult)) {
        throw { status: 400, message: "Failed to retrieve results from Judge0", details: testResult };
    }

    return testResult;
};

/**
 * Parses Judge0 test results into a summary
 */
const parseTestResults = (testResult) => {
    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "accepted";
    let errorMessage = "";

    for (const result of testResult) {
        if (result.status.id === 3) {
            testCasesPassed++;
            runtime = runtime + parseFloat(result.time);
            memory = Math.max(result.memory, memory);
        } else {
            if (result.status.id === 4) {
                status = 'Wrong Answer';
                errorMessage = result.stderr;
            } else if (result.status.id === 6) {
                status = "Compilation Error";
                errorMessage = result.stderr;
            } else if (result.status.id === 5) {
                status = "Time Limit Exceeded";
                errorMessage = result.stderr;
            } else {
                status = "Runtime Error";
                errorMessage = result.stderr;
            }
        }
    }

    return {
        testCasesPassed,
        runtime: runtime.toFixed(3),
        memory,
        status,
        errorMessage
    };
};

/**
 * Updates the submission record in the database with results
 */
const updateSubmissionResult = async (submissionRecord, results) => {
    submissionRecord.status = results.status;
    submissionRecord.testCasesPassed = results.testCasesPassed;
    submissionRecord.runtime = results.runtime;
    submissionRecord.memory = results.memory;
    submissionRecord.errorMessage = results.errorMessage;
    await submissionRecord.save();
    return submissionRecord;
};

/**
 * Full submit flow: create record → execute on Judge0 → parse results → update DB → update user if accepted
 */
const processSubmission = async ({ userId, problemId, code, language, userDoc }) => {
    const problem = await problemModel.findById(problemId);
    if (!problem) {
        throw { status: 404, message: "Problem not found" };
    }

    if (!problem.hiddenTestCases || problem.hiddenTestCases.length === 0) {
        throw { status: 400, message: "No hidden test cases found for this problem." };
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
        throw { status: 400, message: `Unsupported language: ${language}` };
    }

    // Create pending submission record
    const submittedResult = await createSubmissionRecord({
        userId,
        problemId,
        code,
        language,
        testCasesTotal: problem.hiddenTestCases.length,
    });

    // Build and execute on Judge0 (hidden test cases)
    const submissions = buildSubmissionPayload(code, languageId, problem.hiddenTestCases);
    const testResult = await executeOnJudge0(submissions);

    // Parse and save results
    const results = parseTestResults(testResult);
    await updateSubmissionResult(submittedResult, results);

    // Mark problem as solved if all test cases passed
    if (results.status === "accepted" && results.testCasesPassed === submittedResult.testCasesTotal) {
        if (!userDoc.problemSolved.includes(problemId)) {
            userDoc.problemSolved.push(problemId);
            await userDoc.save();
        }
    }

    return submittedResult;
};

/**
 * Run code flow: execute against visible test cases only (no DB record)
 */
const processRun = async ({ problemId, code, language }) => {
    const problem = await problemModel.findById(problemId);
    if (!problem) {
        throw { status: 404, message: "Problem not found" };
    }

    const languageId = getLanguageId(language);
    if (!languageId) {
        throw { status: 400, message: `Unsupported language: ${language}` };
    }

    const submissions = buildSubmissionPayload(code, languageId, problem.visibleTestCases);
    const testResult = await executeOnJudge0(submissions);

    return testResult;
};

module.exports = {
    createSubmissionRecord,
    buildSubmissionPayload,
    executeOnJudge0,
    parseTestResults,
    updateSubmissionResult,
    processSubmission,
    processRun
};
