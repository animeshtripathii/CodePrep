const submissionService = require("../services/submission.service");

const submitCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.problemId;
    const { code, language } = req.body;

    // Validate the input
    if (!code || !language || !problemId || !userId) {
      return res.status(400).json({ message: "Some required fields are missing" });
    }

    await submissionService.processSubmission({
      userId,
      problemId,
      code,
      language,
      userDoc: req.result
    });

    res.status(200).json({ message: "Code submitted successfully" });
  } catch (error) {
    console.error("Error submitting code:", error);
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Internal Server Error",
      ...(error.details && { details: error.details })
    });
  }
};

const runCode = async (req, res) => {
  try {
    const userId = req.result._id;
    const problemId = req.params.problemId;
    const { code, language } = req.body;

    // Validate the input
    if (!code || !language || !problemId || !userId) {
      return res.status(400).json({ message: "Some required fields are missing" });
    }

    const testResult = await submissionService.processRun({ problemId, code, language });

    res.status(200).json({ testResult });
  } catch (error) {
    console.error("Error running code:", error);
    const status = error.status || 500;
    res.status(status).json({
      message: error.message || "Internal Server Error",
      ...(error.details && { details: error.details })
    });
  }
};

module.exports = { submitCode, runCode };
