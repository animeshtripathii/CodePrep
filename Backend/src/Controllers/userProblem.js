const {getLanguageId}=require('../utils/problemSubmissionUtility');
const {submitBatch}=require('../utils/problemSubmissionUtility');
const createProblem=async(req,res)=>{
const{title,description,tags,difficulty,visibleTestCases,hiddenTestCases,startCode,refernceSolution,problemCreator}=req.body;
//solution send by user in refernceSolution is correct or not so we have to validate it before saving to database
//we can run the refernceSolution against the visible test cases and check if it passes all the test cases or not
//if it passes all the test cases then we can save the problem to database otherwise we have to send error response
try
{
for(const sol of refernceSolution){
  const language=sol.language;
  const completeCode=sol.code;
  // format for sending code to judge0 api
//   {
//     source_code:"code",
//     language_id:"language",
//     stdin:"input",
//     expected_output:"output"
//   }
const languageId=getLanguageId(language);
const submission = visibleTestCases.map((testCase) => ({
        source_code: completeCode, // The string containing the user's solution
        languageId: languageId,    // e.g., 63 for JavaScript, 71 for Python, etc.
        stdin: testCase.input,     // Extracting the specific input
        expected_output: testCase.output // Extracting the specific output
}));
const submitResult = await submitBatch(submission)



}
}catch(error){

}
}

module.exports=createProblem;