const { GoogleGenAI } = require("@google/genai");
const submissionModel = require('../models/submission');

const ai = new GoogleGenAI({
    apiKey: process.env.ChatBot_API
});

const isCodingRelatedMessage = (message = '', code = '', problemTitle = '', problemDescription = '') => {
    const text = `${message} ${problemTitle} ${problemDescription}`.toLowerCase();
    const hasCode = String(code || '').trim().length > 0;

    const codingKeywords = [
        'dsa', 'array', 'string', 'linked list', 'stack', 'queue', 'tree', 'graph', 'heap', 'hash',
        'dp', 'dynamic programming', 'backtracking', 'greedy', 'binary search', 'two pointer',
        'sliding window', 'complexity', 'time complexity', 'space complexity', 'leetcode',
        'algorithm', 'bug', 'debug', 'test case', 'runtime', 'memory', 'code', 'function',
        'class', 'compile', 'submission', 'optimize', 'hint', 'solution', 'editorial'
    ];

    return hasCode || codingKeywords.some((key) => text.includes(key));
};


/**
 * 1. Chatbot Alone (DSA Tutor)
 */
const codingChat = async (message, code, language, problemTitle, problemDescription, user) => {
    if (user.tokens < 5) {
        throw new Error("INSUFFICIENT_TOKENS");
    }

    if (!message || String(message).trim() === "") {
        return "I didn't quite catch that. Could you please type your question again?";
    }

    if (!isCodingRelatedMessage(message, code, problemTitle, problemDescription)) {
        return "Prep AI only helps with coding and DSA questions. Please ask about problem-solving, code, test cases, complexity, debugging, or submissions.";
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

        user.tokens -= 5;
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
    if (!message || String(message).trim() === "") {
        return "I didn't quite catch that. Could you please type your question again?";
    }

    const systemInstruction = `**Role & Identity**
You are the website support assistant for CodePrep.
Your goal is to answer platform/navigation/account questions using the current product behavior.
You can fetch live user stats/submissions via tools when users ask about their own progress.

**Current CodePrep Product Knowledge (must stay consistent with app behavior):**
- Dashboard route: /dashboard (requires login).
- Explore problems route: /explore (requires login).
- Code editor route: /editor/:id and /problems/:id.
- Discussions route: /discussions.
- Plans/upgrade route: /plans.
- Settings/account route: /settings.
- Mock interview setup route: /mock-interview-setup.
- Timed session route: /timed-session.

**Mock Interview Rules:**
- AI interview requires CV upload first.
- Non-admin users have limited AI interview attempts.
- Peer mode does not require CV upload.

**AI Assistant Scope & Token Rules:**
- This floating support bot is free to use.
- Prep AI in code editor costs tokens.
- In discussions: normal messages are free; Ask CodeBot costs tokens.

**Support Guidance Rules:**
1. Be concise, friendly, actionable.
2. If user asks where to find a page/feature, give click-by-click UI steps first (for example: "Login -> Navbar -> Dashboard"). Mention login requirement when needed.
3. Do NOT default to raw route strings. Only mention routes if the user explicitly asks for URL/path.
4. If user asks personal progress or recent submissions, call the relevant function tool.
5. If user asks DSA-solving help, direct them to the Code Editor Prep AI and interview tools.
6. Do not invent unavailable features. If unsure, say what is known and suggest the closest supported path.
7. If asked who built/administers CodePrep, answer: Animesh Tripathi is the creator and admin.`;

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

        return response.text;
    } catch (error) {
        console.error("Gemini AI websiteChat error:", error);
        throw new Error("Failed to generate AI response");
    }
};

module.exports = { codingChat, websiteChat };