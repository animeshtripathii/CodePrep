const axios = require('axios');
const getLanguageId=(lang)=>{
    const language={
        "c":50,
        "c++":53,
        "java":91,
        "python":70,
        "javascript":63,
    }
    return language[lang.toLowerCase()];
}

const submitBatch=async(submissions)=>{
    // Function to submit a batch of code submissions to the Judge0 API

const options = {
  method: 'POST',
  url: 'https://judge029.p.rapidapi.com/submissions/batch',
  params: {
    base64_encoded: 'true'
  },
  headers: {
    'x-rapidapi-key': process.env.JUDGE0_API,
    'x-rapidapi-host': 'judge029.p.rapidapi.com',
    'Content-Type': 'application/json'
  },
  data: {
  submissions: submissions
  }
};

async function fetchData() {
	try {
		const response = await axios.request(options);
		return response.data;
	} catch (error) {
		return error.response.data;
	}
}

return await fetchData();
}


module.exports={getLanguageId,submitBatch};