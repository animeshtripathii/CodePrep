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

    console.log("[SubmissionWorker] job started", {
        jobId: String(job.id),
        userId: String(userId),
        problemId: String(problemId),
        submissionId: String(submissionId),
        language,
        skipDriverCode: !!skipDriverCode,
        codeLength: code ? code.length : 0
    });

    try {
        const problem = await problemModel.findById(problemId);
        if (!problem) throw new Error("Problem not found");

        console.log("[SubmissionWorker] problem loaded", {
            jobId: String(job.id),
            hiddenTestCasesCount: problem.hiddenTestCases.length
        });

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

        console.log("[SubmissionWorker] submitBatch success", {
            jobId: String(job.id),
            submissionCount: submitResult.length
        });

        const resultToken = submitResult.map((res) => res?.token).filter(Boolean);
        if (resultToken.length !== submitResult.length) {
            throw new Error("Judge0 did not return valid submission tokens");
        }
        const testResult = await submitToken(resultToken);

        if (!Array.isArray(testResult)) {
            throw new Error("Failed to retrieve results from Judge0");
        }

        console.log("[SubmissionWorker] submitToken success", {
            jobId: String(job.id),
            tokenCount: resultToken.length,
            resultCount: testResult.length
        });

        let testCasesPassed = 0;
        let runtime = 0;
        let memory = 0;
        let status = "accepted";
        let errorMessage = "";

        for (const result of testResult) {
            const statusId = result?.status?.id ?? result?.status_id;

            if (statusId === 3) {
                testCasesPassed++;
                runtime = runtime + parseFloat(result.time || 0);
                memory = Math.max(result.memory || 0, memory);
            } else {
                if (statusId === 4) {
                    status = "Wrong Answer";
                    errorMessage = result.stderr;
                } else if (statusId === 6) {
                    status = "Compilation Error";
                    errorMessage = result.stderr;
                } else if (statusId === 5) {
                    status = "Time Limit Exceeded";
                    errorMessage = result.stderr;
                } else {
                    status = "Runtime Error";
                    errorMessage = result.stderr;
                }
            }
        }

        console.log("[SubmissionWorker] result aggregation", {
            jobId: String(job.id),
            submissionId: String(submissionId),
            status,
            testCasesPassed,
            testCasesTotal: problem.hiddenTestCases.length,
            runtime: runtime.toFixed(3),
            memory
        });

        const updatedSubmission = await submissionModel.findByIdAndUpdate(
            submissionId,
            { status, testCasesPassed, runtime: runtime.toFixed(3), memory, errorMessage },
            { returnDocument: 'after' }
        );

        if (status === "accepted" && testCasesPassed === problem.hiddenTestCases.length) {
            await User.findByIdAndUpdate(userId, { $addToSet: { problemSolved: problemId } });
            console.log("[SubmissionWorker] user solved problem updated", {
                jobId: String(job.id),
                userId: String(userId),
                problemId: String(problemId)
            });
        }

        console.log("[SubmissionWorker] job completed", {
            jobId: String(job.id),
            submissionId: String(submissionId),
            status
        });

        return { message: "Code submitted successfully", submission: updatedSubmission };

    } catch (err) {
        console.error("[SubmissionWorker] job failed", {
            jobId: String(job.id),
            submissionId: String(submissionId),
            error: err.message
        });
        await submissionModel.findByIdAndUpdate(submissionId, { status: "Internal Error", errorMessage: err.message });
        throw err;
    }
}, { connection, skipVersionCheck: true, concurrency: 5 });

module.exports = worker;
