const axios = require('axios');

const getLanguageId = (lang) => {
    const language = {
        "c": 50,
        "c++": 53,
        "java": 62,
        "python": 71,
        "javascript": 63,
    }
    return language[lang.toLowerCase()];
}

const submitBatch = async (submissions) => {
    const options = {
        method: 'POST',
        url: 'https://judge029.p.rapidapi.com/submissions/batch',
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_API,
            'x-rapidapi-host': 'judge029.p.rapidapi.com',
            'Content-Type': 'application/json'
        },
        data: {
            submissions: submissions
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        return error.response ? error.response.data : { error: "Unknown error" };
    }
}

const waiting = (timer) => {
    return new Promise((resolve) => setTimeout(resolve, timer));
};

const submitToken = async (resultTokens) => {
    if (!resultTokens || resultTokens.length === 0) {
        return [];
    }

    const options = {
        method: 'GET',
        url: 'https://judge029.p.rapidapi.com/submissions/batch',
        params: {
            tokens: resultTokens.join(','),
            base64_encoded: 'false',
            fields: '*'
        },
        headers: {
            'x-rapidapi-key': process.env.JUDGE0_API,
            'x-rapidapi-host': 'judge029.p.rapidapi.com'
        }
    };

    async function fetchData() {
        try {
            const response = await axios.request(options);
            return response.data;
        } catch (error) {
            return null;
        }
    }

    while (true) {
        const result = await fetchData();
        
        if (!result || !result.submissions) {
            await waiting(1000);
            continue;
        }

        const isResultObtained = result.submissions.every((submission) => submission.status.id > 2);
        
        if (isResultObtained) {
            return result.submissions;
        }

        await waiting(1000);
    }
}

module.exports = { getLanguageId, submitBatch, submitToken };