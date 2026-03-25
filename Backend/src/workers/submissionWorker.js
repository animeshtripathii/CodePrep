const { Worker } = require("bullmq");
const { connection } = require("../queues/submissionQueue");
const problemModel = require("../models/problem");
const submissionModel = require("../models/submission");
const User = require("../models/user");
const { submitBatch, submitToken } = require("../utils/problemSubmissionUtility");
const { getLanguageId } = require("../utils/problemSubmissionUtility");

// The Worker processes the queue asynchronously
const worker = new Worker("code-submissions", async (job) => {
    const { userId, problemId, code, language, submissionId, skipDriverCode } = job.data;

    try {
        const problem = await problemModel.findById(problemId);
        if (!problem) throw new Error("Problem not found");

        const languageId = getLanguageId(language);
        if (!languageId) throw new Error(`Unsupported language: ${language}`);

        let finalCode = code;
        if (!skipDriverCode && problem.driverCode && problem.driverCode.length > 0) {
            const driver = problem.driverCode.find(dc => dc.language.toLowerCase() === language.toLowerCase());
            if (driver && driver.code && driver.code.includes("{{USER_CODE}}")) {
                finalCode = driver.code.replace("{{USER_CODE}}", code);
            }
        }

        const submission = problem.hiddenTestCases.map((testCase) => ({
            source_code: finalCode,
            language_id: languageId,
            stdin: testCase.input,
            expected_output: testCase.output,
        }));

        const submitResult = await submitBatch(submission);
        if (!Array.isArray(submitResult)) {
            throw new Error("Submission failed at Judge0");
        }

        const resultToken = submitResult.map((res) => res.token);
        const testResult = await submitToken(resultToken);

        if (!Array.isArray(testResult)) {
            throw new Error("Failed to retrieve results from Judge0");
        }

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = "accepted";
        let errorMessage = "";

        for (const result of testResult) {
            if (result.status.id === 3) {
                testCasesPassed++;
                runtime = runtime + parseFloat(result.time || 0);
                memory = Math.max(result.memory || 0, memory);
            } else {
                if (result.status.id === 4) {
                    status = "Wrong Answer";
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

        const updatedSubmission = await submissionModel.findByIdAndUpdate(
            submissionId,
            { status, testCasesPassed, runtime: runtime.toFixed(3), memory, errorMessage },
            { returnDocument: 'after' }
        );

        if (status === "accepted" && testCasesPassed === problem.hiddenTestCases.length) {
            await User.findByIdAndUpdate(userId, { $addToSet: { problemSolved: problemId } });
        }

        return { message: "Code submitted successfully", submission: updatedSubmission };

    } catch (err) {
        await submissionModel.findByIdAndUpdate(submissionId, { status: "Internal Error", errorMessage: err.message });
        throw err;
    }
}, { connection, skipVersionCheck: true, concurrency: 5 });

module.exports = worker;
