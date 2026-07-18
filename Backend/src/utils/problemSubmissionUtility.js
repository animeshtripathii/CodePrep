// Helper to map languages to Judge0 IDs
const axios = require('axios');

// Use the self-hosted Judge0 instance (JUDGE0_URL env var)
// Falls back to localhost for local development
const getJudge0BaseUrl = () => {
    const url = process.env.JUDGE0_URL || 'http://localhost:2358';
    // Strip trailing slash if present
    return url.replace(/\/$/, '');
};

const getLanguageId = (lang) => {
    const languages = {
        "c": 50,
        "c++": 53,
        "cpp": 53,
        "java": 62,
        "python": 71,
        "javascript": 63,
    };
    return languages[lang.toLowerCase()];
};

// Submit a batch of submissions to Judge0
// Returns the array of submission tokens, or null on failure
const submitBatch = async (submissions) => {
    const baseUrl = getJudge0BaseUrl();
    try {
        const response = await axios.post(
            `${baseUrl}/submissions/batch?base64_encoded=false`,
            { submissions },
            {
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000, // 30s timeout
            }
        );
        return response.data;
    } catch (error) {
        console.error(
            'Judge0 submitBatch error:',
            error.response ? JSON.stringify(error.response.data) : error.message
        );
        return null;
    }
};

const waiting = (timer) => {
    return new Promise((resolve) => setTimeout(resolve, timer));
};

// Poll Judge0 for results until all submissions are done (status.id > 2)
const submitToken = async (resultTokens) => {
    if (!resultTokens || resultTokens.length === 0) {
        return [];
    }

    const baseUrl = getJudge0BaseUrl();

    async function fetchData() {
        try {
            const response = await axios.get(
                `${baseUrl}/submissions/batch`,
                {
                    params: {
                        tokens: resultTokens.join(','),
                        base64_encoded: 'false',
                        fields: '*',
                    },
                    timeout: 30000,
                }
            );
            return response.data;
        } catch (error) {
            console.error(
                'Judge0 submitToken fetch error:',
                error.response ? JSON.stringify(error.response.data) : error.message
            );
            return null;
        }
    }

    // Poll with a max of 30 attempts (~30 seconds) to avoid infinite loops on Render
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
        attempts++;
        const result = await fetchData();

        if (!result || !result.submissions) {
            await waiting(1000);
            continue;
        }

        const isResultObtained = result.submissions.every(
            (submission) => submission.status && submission.status.id > 2
        );

        if (isResultObtained) {
            return result.submissions;
        }

        await waiting(1000);
    }

    throw new Error('Judge0 polling timed out after 30 seconds. The server may be overloaded.');
};

module.exports = { getLanguageId, submitBatch, submitToken };