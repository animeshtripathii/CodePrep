const { getLanguageId, submitBatch, submitToken } = require('../utils/problemSubmissionUtility');
const problemModel = require('../models/problem');
const User = require('../models/user');

const createProblem = async (req, res) => {
    const { title, description, tags, difficulty, visibleTestCases, hiddenTestCases, startCode, referenceSolution } = req.body;

    try {
        for (const sol of referenceSolution) {
            const language = sol.language;
            const completeCode = sol.completeCode;
            const languageId = getLanguageId(language);
            
            if (!languageId) {
                return res.status(400).json({ message: `Unsupported language: ${language}` });
            }

            const submission = visibleTestCases.map((testCase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testCase.input,
                expected_output: testCase.output
            }));

            const submitResult = await submitBatch(submission);
            console.log("Submission Result for reference solution:", submitResult);

            if (!Array.isArray(submitResult)) {
                return res.status(400).json({ 
                    message: "Submission failed at Judge0", 
                    details: submitResult 
                });
            }

            const resultToken = submitResult.map((res) => res.token);
            const testResult = await submitToken(resultToken);
           console.log("Test Result for reference solution:", testResult);

            for (const result of testResult) {
                switch (result.status.id) {
                    case 3:
                        continue; // Accepted
                    case 4:
                        return res.status(400).json({ message: "Wrong Answer in reference solution" });
                    case 5:
                        return res.status(400).json({ message: "Time Limit Exceeded in reference solution" });
                    case 6:
                        return res.status(400).json({ message: "Compilation Error in reference solution" });
                    default:
                        if (result.status.id > 6) {
                             return res.status(400).json({ message: `Runtime Error (${result.status.description}) in reference solution` });
                        }
                        return res.status(400).json({ message: "Unknown error in reference solution" });
                }
            }
        }

        const userProblem = await problemModel.create({
            ...req.body,
            problemCreator: req.result._id 
        });

        res.status(201).json({ message: "Problem created successfully", problem: userProblem });
        
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
const updateProblem=async(req,res)=>{
   const problemId=req.params.id;
 
    const { title, description, tags, difficulty, visibleTestCases, hiddenTestCases, startCode, referenceSolution, problemCreator } = req.body;
try{  
    if(!problemId){
        return res.status(400).json({message:"Problem ID is required"});
    }
    const DsaProblem=await problemModel.findById(problemId);
if(!DsaProblem){
    return res.status(404).json({message:"Problem not found"});
}
for (const sol of referenceSolution) {
            const language = sol.language;
            const completeCode = sol.completeCode;
            const languageId = getLanguageId(language);
            
            if (!languageId) {
                return res.status(400).json({ message: `Unsupported language: ${language}` });
            }

            const submission = visibleTestCases.map((testCase) => ({
                source_code: completeCode,
                language_id: languageId,
                stdin: testCase.input,
                expected_output: testCase.output
            }));

            const submitResult = await submitBatch(submission);
            console.log("Submission Result for reference solution:", submitResult);

            if (!Array.isArray(submitResult)) {
                return res.status(400).json({ 
                    message: "Submission failed at Judge0", 
                    details: submitResult 
                });
            }

            const resultToken = submitResult.map((res) => res.token);
            const testResult = await submitToken(resultToken);
           console.log("Test Result for reference solution:", testResult);

            for (const result of testResult) {
                switch (result.status.id) {
                    case 3:
                        continue; // Accepted
                    case 4:
                        return res.status(400).json({ message: "Wrong Answer in reference solution" });
                    case 5:
                        return res.status(400).json({ message: "Time Limit Exceeded in reference solution" });
                    case 6:
                        return res.status(400).json({ message: "Compilation Error in reference solution" });
                    default:
                        if (result.status.id > 6) {
                             return res.status(400).json({ message: `Runtime Error (${result.status.description}) in reference solution` });
                        }
                        return res.status(400).json({ message: "Unknown error in reference solution" });
                }
            }
        }
const newProblem=await problemModel.findByIdAndUpdate(problemId, {
    ...req.body
},{runValidators:true,new:true});
res.status(200).json({message:"Problem updated successfully",problem:newProblem});
}catch(error){
    res.status(500).json({ message: "Internal Server Error", error: error.message });
}
}
const deleteProblem=async(req,res)=>{
    const problemId=req.params.id;
    try{
        if(!problemId){
            return res.status(400).json({message:"Problem ID is required"});
        }
        const DsaProblem=await problemModel.findById(problemId);
    if(!DsaProblem){
        return res.status(404).json({message:"Problem not found"});
    }
    await problemModel.findByIdAndDelete(problemId);
    res.status(200).json({message:"Problem deleted successfully"});
    }catch(error){
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}
const getProblemById=async(req,res)=>{
    const problemId=req.params.id;
    try{
        if(!problemId){
            return res.status(400).json({message:"Problem ID is required"});
        }
        const DsaProblem=await problemModel.findById(problemId).select('title description tags difficulty visibleTestCases referenceSolution startCode ');
    if(!DsaProblem){
        return res.status(404).json({message:"Problem not found"});
    }
    res.status(200).json({problem:DsaProblem});
    }catch(error){
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const getAllProblem=async(req,res)=>{

    //here we can implement pagination,because if databse have large number of problems then it will be difficult to fetch all problems at once and it will take more time to load the problems this is bad for user experience

    //but for pagination we need to send page number and limit of problems per page from frontend in query params like /getAllProblem?page=1&limit=10

    //and then we can use skip and limit method of mongoose to fetch the problems accordingly
    //skip=(page-1)*limit
    //limit=limit

    //formula for calculating skip and limit
    //example if page=2 and limit=10 then skip=(2-1)*10=10 and limit=10 so we will fetch problems from 11 to 20

    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const allProblem = await problemModel.find({})
            .select('title description tags difficulty')
            .skip(skip)
            .limit(limit);

        const totalProblems = await problemModel.countDocuments();

        res.status(200).json({
            problems: allProblem,
            currentPage: page,
            totalPages: Math.ceil(totalProblems / limit),
            totalProblems
        });
    }catch(error){
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

const solvedAllProblemUser=async(req,res)=>{
    try{
   const count=req.result.problemSolved.length;
 const userId=req.result._id;
 const user=await User.findByIdAndUpdate(userId).populate('problemSolved','_id title description tags difficulty');
   return res.status(200).json({count:count, user:user.problemSolved});
    }catch(error){
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
}

module.exports = {createProblem,updateProblem,deleteProblem,getProblemById,getAllProblem,solvedAllProblemUser};