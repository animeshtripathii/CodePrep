const axios = require('axios');

// Update this to your new Azure IP


const getLanguageId = (lang) => {
    const languages = {
        "c": 50,
        "c++": 54, // Note: 54 is usually GCC 9.2.0 in Judge0 v1.13
        "java": 62,
        "python": 71,
        "javascript": 63,
    };
    return languages[lang.toLowerCase()];
};

// 1. Submit Batch Function
const submitBatch = async (submissions) => {
    const options = {
        method: 'POST',
        // Note: Self-hosted Judge0 uses /submissions/batch directly
        url: `${JUDGE0_URL}/submissions/batch?base64_encoded=false&wait=true`,
        headers: {
            'Content-Type': 'application/json'
            // No RapidAPI keys needed here!
        },
        data: { submissions }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        console.error("Azure Judge0 Error:", error.response ? error.response.data : error.message);
        return null;
    }
};

const waiting = (timer) => new Promise((resolve) => setTimeout(resolve, timer));

// 2. Get Results by Tokens
const submitToken = async (resultTokens) => {
    if (!resultTokens || resultTokens.length === 0) return [];

    const options = {
        method: 'GET',
        url: `${JUDGE0_URL}/submissions/batch`,
        params: {
            tokens: resultTokens.join(','),
            base64_encoded: 'false',
            fields: '*'
        }
    };

    while (true) {
        try {
            const response = await axios.request(options);
            const result = response.data;

            if (!result || !result.submissions) {
                await waiting(1000);
                continue;
            }

            // status.id > 2 means it's finished (either Success, Runtime Error, or Wrong Answer)
            const isResultObtained = result.submissions.every((s) => s.status_id > 2 || (s.status && s.status.id > 2));

            if (isResultObtained) {
                return result.submissions;
            }
        } catch (error) {
            console.error("Polling Error:", error.message);
        }
        await waiting(1000);
    }
}

module.exports = { getLanguageId, submitBatch, submitToken };
