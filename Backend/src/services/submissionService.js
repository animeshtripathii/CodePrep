const problemModel = require("../models/problem");
const submissionModel = require("../models/submission");
const { getLanguageId, submitBatch, submitToken } = require("../utils/problemSubmissionUtility");

const processCodeSubmission = async (userId, problemId, code, language, reqResult) => {
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

    const languageId = getLanguageId(language);
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const submission = problem.hiddenTestCases.map((testCase) => ({
        source_code: code,
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

    let testCasesPassed = 0;
    let runtime = 0;
    let memory = 0;
    let status = "accepted";
    let errorMessage = "";

    for (const result of testResult) {
        if (result.status.id === 3) {
            testCasesPassed++;
            runtime = runtime + parseFloat(result.time)
            memory = Math.max(result.memory, memory);
        } else {
            if (result.status.id === 4) {
                status = 'Wrong Answer';
                errorMessage = result.stderr;
            } else if (result.status.id === 6) {
                status = "Compilation Error";
                errorMessage = result.stderr;
            }
            else if (result.status.id === 5) {
                status = "Time Limit Exceeded";
                errorMessage = result.stderr;
            } else {
                status = "Runtime Error";
                errorMessage = result.stderr;
            }
        }
    }

    submittedResult.status = status;
    submittedResult.testCasesPassed = testCasesPassed;
    submittedResult.runtime = runtime.toFixed(3);
    submittedResult.memory = memory;
    submittedResult.errorMessage = errorMessage;
    await submittedResult.save();

    if (status === "accepted" && testCasesPassed === submittedResult.testCasesTotal) {
        if (!reqResult.problemSolved.includes(problemId)) {
            reqResult.problemSolved.push(problemId);
            await reqResult.save();
        }
    }

<<<<<<< HEAD
    return { message: "Code submitted successfully", submission: submittedResult };
=======
<<<<<<< HEAD
    return { message: "Code submitted successfully", submission: submittedResult };
=======
    return { message: "Code submitted successfully" };
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
};

const executeCode = async (userId, problemId, code, language) => {
    if (!code || !language || !problemId || !userId) {
        throw new Error("Some required fields are missing");
    }
<<<<<<< HEAD
    console.log("executeCode is called");
=======
<<<<<<< HEAD
    console.log("executeCode is called");
=======

>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
    const problem = await problemModel.findById(problemId);

    const languageId = getLanguageId(language);
    if (!languageId) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const submission = problem.visibleTestCases.map((testCase) => ({
        source_code: code,
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
const getSubmissionsForProblem = async (userId, problemId) => {
    const submissions = await submissionModel.find({ userId, problemId }).sort({ createdAt: -1 });
    return submissions;
};

module.exports = {
    processCodeSubmission,
    executeCode,
    getSubmissionsForProblem
<<<<<<< HEAD
=======
=======
module.exports = {
    processCodeSubmission,
    executeCode
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
};
