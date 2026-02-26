const { GoogleGenAI } = require("@google/genai");
const submissionModel = require('../models/submission');
// require('dotenv').config();

const ai = new GoogleGenAI({
    apiKey: process.env.ChatBot_API

});


/**
 * 1. Chatbot Alone (DSA Tutor)
 */
const codingChat = async (message, code, language, problemTitle, problemDescription, user) => {
    if (user.tokens <= 0) {
        throw new Error("INSUFFICIENT_TOKENS");
    }
    if (!message || String(message).trim() === "") {
        return "I didn't quite catch that. Could you please type your question again?";
    }

    const engineeredPrompt = `The user is asking for help on a Data Structures and Algorithms problem.
  
Problem Title: ${problemTitle || 'Unknown'}
Problem Description: ${problemDescription || 'Unknown'}

User's Current Code (${language || 'Unknown'}):
\`\`\`${language || ''}
${code || 'No code provided'}
\`\`\`

User's Question:
${message}
`;

    const systemInstruction = `**Role & Identity**
You are an expert Data Structures and Algorithms (DSA) tutor. Your primary goal is to help users learn how to solve algorithmic problems, providing guidance unless they specifically request the answer.

**Strict Constraints & Rules**
1. **DSA ONLY:** You must ONLY answer questions related to Data Structures, Algorithms, time/space complexity, and competitive programming. 
2. **Refuse Off-Topic Queries:** If the user asks about anything outside of DSA (e.g., general advice, making small talk, or platform questions), politely decline. Say something like: "I am a dedicated DSA tutor and can only help you with Data Structures and Algorithms. Do you have a coding problem you'd like to discuss?"
3. **DEFAULT TO HINTS:** When a user presents a DSA problem without specifying what they want, DO NOT give them the complete code right away. 
4. **PROVIDE HINTS:** Provide 1 to 3 targeted hints focusing on intuition, pattern recognition, or suggesting a data structure.
5. **THE FOLLOW-UP:** End your hint response by asking if they want to try coding it themselves or if they'd like the full solution. 
6. **IMMEDIATE SOLUTION UPON REQUEST:** If the user explicitly asks for the full solution, provide the complete code and step-by-step explanation.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: engineeredPrompt,
            config: {
                systemInstruction: systemInstruction
            }
        });

        user.tokens -= 20;
        await user.save();

        return response.text;
    } catch (error) {
        console.error("Gemini AI codingChat error:", error);
        throw new Error("Failed to generate AI response");
    }
};

/**
 * 2. Function Calling Model (Website Support Chatbot)
 */
const websiteChat = async (message, user) => {
    if (user.tokens <= 0) {
        throw new Error("INSUFFICIENT_TOKENS");
    }

    if (!message || String(message).trim() === "") {
        return "I didn't quite catch that. Could you please type your question again?";
    }



    const systemInstruction = `**Role & Identity**
You are a helpful customer support and general assistant for the CodePrep platform. 
Your primary goal is to answer questions about the platform, explain features, and guide users.
You have access to tools that can fetch live user statistics and recent submissions. Always use these tools if the user asks about their personal progress, profile, or recent submissions.

**CodePrep Knowledge Base:**
- CodePrep is a coding practice platform for Data Structures and Algorithms (DSA).
- Users can track their progress on their Dashboard (Total Problems Solved, Activity Heatmap, Language Pie Chart).
- To edit their profile, users go to the Dashboard and click 'Edit Profile'.
- To solve a problem, users select it from the Home or Problems page, use the Code Editor, select their language, write code, run against public test cases, and click Submit for hidden test cases.
- There are two AI assistants: The Platform Support Assistant (you) and the DSA Tutor (in the Code Editor).
- For password resets, contact the site administrator. CodePrep is free. Supported languages: JavaScript, Python, C++, Java.

**Rules**
1. Be concise, friendly, and helpful.
2. If the user asks about their own stats or submissions, CALL THE APPROPRIATE FUNCTION to get their live data.
3. If they ask DSA coding questions, suggest they use the "AI Assistant" inside the Code Editor page.`;

    const chatSession = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
            systemInstruction: systemInstruction,
            tools: [{
                functionDeclarations: [
                    {
                        name: "getUserStats",
                        description: "Get the total number of problems solved by the current user, along with their role and email."
                    },
                    {
                        name: "getRecentSubmissions",
                        description: "Get the user's 5 most recent code submissions to see their status, language, and the problem title they attempted."
                    }
                ]
            }]
        }
    });

    try {
        // Send the validated string message wrapped in the required object structure
        let response = await chatSession.sendMessage({ message: String(message) });

        if (response.functionCalls && response.functionCalls.length > 0) {
            const call = response.functionCalls[0];
            let apiResponse = {};

            if (call.name === "getUserStats") {
                apiResponse = {
                    totalProblemsSolved: user?.problemSolved ? user.problemSolved.length : 0,
                    email: user?.emailId || 'Unknown',
                    role: user?.role || 'User',
                    firstName: user?.firstName || 'User',
                    lastName: user?.lastName || ''
                };
            } else if (call.name === "getRecentSubmissions" && user?._id) {
                const recent = await submissionModel.find({ userId: user._id })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('problemId', 'title');

                apiResponse = {
                    submissions: recent.map(s => ({
                        problemTitle: s.problemId?.title || 'Unknown Problem',
                        status: s.status || 'Unknown',
                        language: s.language || 'Unknown',
                        runtime: s.runtime || 0,
                        memory: s.memory || 0
                    }))
                };
            }

            const cleanResponse = JSON.parse(JSON.stringify(apiResponse));

            const functionResponsePart = {
                functionResponse: {
                    name: call.name,
                    response: Object.keys(cleanResponse).length > 0 ? cleanResponse : { result: "No data found" }
                }
            };

            if (call.id) {
                functionResponsePart.functionResponse.id = call.id;
            }

            response = await chatSession.sendMessage({
                message: {
                    role: "user",
                    parts: [functionResponsePart]
                }
            });
        }

        user.tokens -= 20;
        await user.save();

        return response.text;
    } catch (error) {
        console.error("Gemini AI websiteChat error:", error);
        throw new Error("Failed to generate AI response");
    }
};

module.exports = { codingChat, websiteChat };