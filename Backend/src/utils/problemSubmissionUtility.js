const axios = require('axios');

// Update this to your new Azure IP
// This checks the .env first, but uses your IP as a backup if it's missing
const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";

const getLanguageId = (lang) => {
    const languages = {
        "c": 50,
        "c++": 54, 
        "cpp": 54, // Added cpp support
        "java": 62,
        "python": 71,
        "javascript": 63,
    };
    return languages[lang.toLowerCase()];
};

// 1. Submit Batch Function
const submitBatch = async (submissions) => {
    console.log("[Judge0Utility] submitBatch start", {
        submissionsCount: Array.isArray(submissions) ? submissions.length : 0,
        endpoint: `${JUDGE0_URL}/submissions/batch`
    });

    const options = {
        method: 'POST',
        // Use wait=false so Judge0 reliably returns tokens for polling.
        url: `${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=false`,
        headers: {
            'Content-Type': 'application/json'
            // No RapidAPI keys needed here!
        },
        data: { submissions }
    };

    try {
        const response = await axios.request(options);
        console.log("[Judge0Utility] submitBatch success", {
            submissionsCount: Array.isArray(response.data) ? response.data.length : 0
        });
        return response.data;
    } catch (error) {
        console.error("Azure Judge0 Error:", error.response ? error.response.data : error.message);
        return null;
    }
};

const waiting = (timer) => new Promise((resolve) => setTimeout(resolve, timer));

const decodeBase64Field = (value) => {
    if (typeof value !== 'string' || value.length === 0) return value;
    try {
        return Buffer.from(value, 'base64').toString('utf8');
    } catch {
        return value;
    }
};

const normalizeSubmissionResult = (submission) => ({
    ...submission,
    stdout: decodeBase64Field(submission?.stdout),
    stderr: decodeBase64Field(submission?.stderr),
    compile_output: decodeBase64Field(submission?.compile_output),
    message: decodeBase64Field(submission?.message),
    stdin: decodeBase64Field(submission?.stdin),
    expected_output: decodeBase64Field(submission?.expected_output)
});

// 2. Get Results by Tokens
const submitToken = async (resultTokens) => {
    const validTokens = Array.isArray(resultTokens)
        ? resultTokens.filter((token) => typeof token === 'string' && token.trim().length > 0)
        : [];

    if (validTokens.length === 0) {
        console.error("[Judge0Utility] submitToken aborted: no valid tokens", {
            rawTokens: resultTokens
        });
        return null;
    }

    console.log("[Judge0Utility] submitToken start", {
        tokenCount: validTokens.length,
        endpoint: `${JUDGE0_URL}/submissions/batch`
    });

    const options = {
        method: 'GET',
        url: `${JUDGE0_URL}/submissions/batch`,
        params: {
            tokens: validTokens.join(','),
            // Fetch result payloads as base64 to avoid Judge0 UTF-8 conversion errors.
            base64_encoded: 'true',
            fields: '*'
        }
    };

    let retries = 0;
    const MAX_RETRIES = 10;

    while (retries < MAX_RETRIES) {
        try {
            console.log("[Judge0Utility] submitToken polling", {
                attempt: retries + 1,
                maxRetries: MAX_RETRIES
            });

            const response = await axios.request(options);
            const result = response.data;

            if (!result || !result.submissions) {
                await waiting(1000);
                retries++;
                continue;
            }

            // status.id > 2 means it's finished (either Success, Runtime Error, or Wrong Answer)
            const isResultObtained = result.submissions.every((s) => s.status_id > 2 || (s.status && s.status.id > 2));

            if (isResultObtained) {
                const normalizedResults = result.submissions.map(normalizeSubmissionResult);
                console.log("[Judge0Utility] submitToken results ready", {
                    submissionsCount: normalizedResults.length,
                    attemptsUsed: retries + 1
                });
                return normalizedResults;
            }
        } catch (error) {
            console.error("Polling Error:", error.response ? error.response.data : error.message);
            // If it's a persistent client error (4xx), don't keep retrying indefinitely.
            if (error.response && error.response.status >= 400 && error.response.status < 500) {
                console.error("Stopping poll due to non-recoverable error.");
                return null;
            }
        }
        await waiting(1000);
        retries++;
    }
    console.error("Polling stopped: MAX_RETRIES reached.");
    return null;
}

module.exports = { getLanguageId, submitBatch, submitToken };
