const problemModel = require("../models/problem");
const submissionModel = require("../models/submission");
const {  getLanguageId,submitBatch,submitToken} = require("../utils/problemSubmissionUtility");
const submitCode = async (req, res) => {
  // Logic to handle code submission when user submits code for a problem
  try {
    const userId = req.result._id;
    const problemId = req.params.problemId;
    const { code, language } = req.body;
    // Validate the input
    if (!code || !language || !problemId || !userId) {
      return res
        .status(400)
        .json({ message: "Some required fields are missing" });
    }
    // fetch the problem details from database using problemId
    // Here you can implement the logic to compile and run the code against hidden test cases

    const problem = await problemModel.findById(problemId);

    // here before compiling and running the code, save it in the database beacuse something it may happen judge0 or any other service is down or throw an error
    const submittedResult = await submissionModel.create({
      userId,
      problemId,
      code,
      language,
      status: "pending",
      testCasesTotal: problem.hiddenTestCases.length,
    });

    // Logic to compile and run the code against hidden test cases and get the results
    // You can use a library like 'child_process' to execute the code in a secure environment
    // After getting the results, you can compare them with expected output and send response back to user

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res
        .status(400)
        .json({ message: `Unsupported language: ${language}` });
    }
    const submission = problem.hiddenTestCases.map((testCase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testCase.input,
      expected_output: testCase.output,
    }));

    const submitResult = await submitBatch(submission);
    if (!Array.isArray(submitResult)) {
      return res.status(400).json({
        message: "Submission failed at Judge0",
        details: submitResult,
      });
    }

    const resultToken = submitResult.map((res) => res.token);
    const testResult = await submitToken(resultToken);

    if(!Array.isArray(testResult)){
        return res.status(400).json({
            message: "Failed to retrieve results from Judge0",
            details: testResult,
          });
    }

let testCasesPassed = 0;
let runtime = 0;
let memory = 0;
let status = "accepted";
let errorMessage = "";
    //now we have to update submittedResult 

    for(const result of testResult){
        if(result.status.id === 3){
            testCasesPassed++;
            runtime= runtime +parseFloat(result.time)
            memory = Math.max(result.memory,memory);
        }else{
            if(result.status.id === 4){
                status='Wrong Answer';
                errorMessage = result.stderr;
            }else if(result.status.id === 6){
                status="Compilation Error";
                errorMessage = result.stderr;
            }
            else if(result.status.id === 5){
                status="Time Limit Exceeded";
                errorMessage = result.stderr;
            }else{  
                status="Runtime Error";
                errorMessage = result.stderr;
            }

        }

    }

    //update the submission result in database
   submittedResult.status = status;
   submittedResult.testCasesPassed = testCasesPassed;
   submittedResult.runtime = runtime.toFixed(3);
   submittedResult.memory = memory;
   submittedResult.errorMessage = errorMessage;
   await submittedResult.save();

//Problem id should be added in the problemSolved array of user in user schema only when all the test cases are passed and status is accepted
  if(status === "accepted" && testCasesPassed === submittedResult.testCasesTotal) {
    if(!req.result.problemSolved.includes(problemId)) {
      req.result.problemSolved.push(problemId);
      await req.result.save();
    }
  }
    res.status(200).json({
      message: "Code submitted successfully",
    });
  } catch (error) {
    console.error("Error submitting code:", error);
    res.status(500).json({ message: error.message });
  }
};
const runCode=async(req,res)=>{ try {
    const userId = req.result._id;
    const problemId = req.params.problemId;
    const { code, language } = req.body;
    // Validate the input
    if (!code || !language || !problemId || !userId) {
      return res
        .status(400)
        .json({ message: "Some required fields are missing" });
    }
    // fetch the problem details from database using problemId
    // Here you can implement the logic to compile and run the code against hidden test cases

    const problem = await problemModel.findById(problemId);

    const languageId = getLanguageId(language);
    if (!languageId) {
      return res
        .status(400)
        .json({ message: `Unsupported language: ${language}` });
    }
    const submission = problem.visibleTestCases.map((testCase) => ({
      source_code: code,
      language_id: languageId,
      stdin: testCase.input,
      expected_output: testCase.output,
    }));

    const submitResult = await submitBatch(submission);
    if (!Array.isArray(submitResult)) {
      return res.status(400).json({
        message: "Submission failed at Judge0",
        details: submitResult,
      });
    }

    const resultToken = submitResult.map((res) => res.token);
    const testResult = await submitToken(resultToken);

    if(!Array.isArray(testResult)){
        return res.status(400).json({
            message: "Failed to retrieve results from Judge0",
            details: testResult,
          });
    }

    res.status(200).json({testResult});
  } catch (error) {
    console.error("Error submitting code:", error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = {submitCode,runCode};
