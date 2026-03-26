const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.ChatBot_API);
const ai = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const initMockInterviewSocket = (io) => {
    const mockAuthMiddleware = async (socket, next) => {
        try {
            let token = socket.handshake.auth.token;

            if (!token && socket.handshake.headers.cookie) {
                const cookieString = socket.handshake.headers.cookie;
                const match = cookieString.match(/(?:^|;\s*)token=([^;]*)/);
                if (match) token = decodeURIComponent(match[1]);
            }

            if (!token) return next(new Error("Authentication error: No token"));

            const decoded = jwt.verify(token, process.env.JWT_Secret_Key);
            const user = await User.findById(decoded._id);
            if (!user) return next(new Error("Authentication error: User not found"));

            socket.user = user;
            next();
        } catch (err) {
            console.error("Mock Interview Socket Auth Error:", err);
            next(new Error("Authentication error: Invalid Token"));
        }
    };

    const mockIo = io.of('/mock-interview');
    mockIo.use(mockAuthMiddleware);

    const roomMap = {};
    const deadRooms = new Set();

    mockIo.on('connection', (socket) => {
        socket.on('join_interview', ({ roomId, mode, cvText, role, cvFileName }, cb) => {
            if (deadRooms.has(roomId)) {
                if (typeof cb === 'function') {
                    cb({ success: false, message: "This interview room has been closed by the creator.", isClosed: true });
                }
                return;
            }

            // mode: "peer" or "ai"
            if (mode === 'ai') {
                if (!cvText || !String(cvText).trim()) {
                    if (typeof cb === 'function') {
                        cb({ success: false, message: "Please upload CV before joining AI mock interview." });
                    }
                    return;
                }

                const usedCount = Number(socket.user?.aiMockInterviewCount || 0);
                if (socket.user?.role !== 'admin' && usedCount > 2) {
                    if (typeof cb === 'function') {
                        cb({ success: false, message: "AI mock interview limit reached. You can use it only 2 times." });
                    }
                    return;
                }
            }

            if (!roomMap[roomId]) {
                roomMap[roomId] = { 
                    users: [], 
                    code: "", 
                    language: "javascript",
                    creatorUserId: socket.user._id 
                };
            }

            socket.join(roomId);
            socket.roomId = roomId;
            socket.mode = mode;

            // Save role & cvText to room
            if (role) roomMap[roomId].role = role;
            if (cvText) roomMap[roomId].cvText = cvText;

            // check if AI mode and if we need to add a dummy AI user
            if (mode === "ai" && roomMap[roomId].users.length === 0) {
                roomMap[roomId].users.push({ socketId: 'ai-bot', userId: 'ai', isAI: true });
            }

            roomMap[roomId].users = roomMap[roomId].users.filter((u) => u.socketId !== socket.id);

            roomMap[roomId].users.push({
                socketId: socket.id,
                userId: socket.user._id,
                firstName: socket.user.firstName,
                cvFileName: cvFileName || null,
                isAI: false
            });

            // notify others in room
            socket.to(roomId).emit('user_joined', {
                socketId: socket.id,
                userId: socket.user._id,
                firstName: socket.user.firstName,
                cvFileName: cvFileName || null
            });
            if (typeof cb === 'function') {
                cb({
                    success: true,
                    code: roomMap[roomId].code,
                    language: roomMap[roomId].language,
                    users: roomMap[roomId].users
                });
            }
        });

        // ─── Code Synchronization ───
        socket.on('code_change', ({ roomId, code }) => {
            if (roomMap[roomId]) {
                roomMap[roomId].code = code;
                // Broadcast to everyone else in the room
                socket.to(roomId).emit('code_update', { code });
            }
        });

        socket.on('language_change', ({ roomId, language }) => {
            if (roomMap[roomId]) {
                roomMap[roomId].language = language;
                socket.to(roomId).emit('language_update', { language });
            }
        });

        socket.on('submit_cv', ({ roomId, cvText }) => {
            if (roomMap[roomId]) {
                roomMap[roomId].cvText = cvText;
                // AI acknowledges CV
                mockIo.to(roomId).emit('ai_response', { text: "I've received your CV. We can discuss it during our interview." });
            }
        });

        // ─── WebRTC Signaling ───
        socket.on('webrtc_offer', ({ roomId, offer, target }) => {
            if (target) {
                socket.to(target).emit('webrtc_offer', { offer, from: socket.id });
            } else {
                socket.to(roomId).emit('webrtc_offer', { offer, from: socket.id });
            }
        });

        socket.on('webrtc_answer', ({ roomId, answer, target }) => {
            if (target) {
                socket.to(target).emit('webrtc_answer', { answer, from: socket.id });
            } else {
                socket.to(roomId).emit('webrtc_answer', { answer, from: socket.id });
            }
        });

        socket.on('webrtc_ice_candidate', ({ roomId, candidate, target }) => {
            if (target) {
                socket.to(target).emit('webrtc_ice_candidate', { candidate, from: socket.id });
            } else {
                socket.to(roomId).emit('webrtc_ice_candidate', { candidate, from: socket.id });
            }
        });

        // ─── Peer Chat & Whiteboard ───
        socket.on('peer_chat_message', ({ roomId, message }) => {
            socket.to(roomId).emit('peer_chat_message', { 
                sender: socket.user.firstName, 
                message, 
                timestamp: new Date().toISOString() 
            });
        });

        socket.on('draw_data', ({ roomId, data }) => {
            socket.to(roomId).emit('draw_data', { data });
        });

        socket.on('clear_whiteboard', ({ roomId }) => {
            socket.to(roomId).emit('clear_whiteboard');
        });

        socket.on('ai_voice_message', async ({ roomId, text }, cb) => {
            try {
                if (socket.user.tokens < 2) {
                    console.error("[MockInterview] Insufficient tokens.");
                    if (typeof cb === 'function') cb({ error: "Insufficient tokens for AI Mock Interview." });
                    return socket.emit('ai_error', { message: "Insufficient tokens left for AI Mock Interview." });
                }
                
                await User.updateOne({ _id: socket.user._id }, { $inc: { tokens: -5 } });
                
                let codeContext = "";
                if (roomMap[roomId]) {
                    codeContext = `Current Code in Editor:\n\`\`\`${roomMap[roomId].language}\n${roomMap[roomId].code}\n\`\`\`\n`;
                }

                let cvContext = "";
                if (roomMap[roomId] && roomMap[roomId].cvText) {
                    cvContext = `The candidate has provided their CV:\n\`\`\`\n${roomMap[roomId].cvText}\n\`\`\`\n`;
                }

                let roleContext = "Software Engineer";
                if (roomMap[roomId] && roomMap[roomId].role) {
                    roleContext = roomMap[roomId].role;
                }

                const systemInstruction = `You are an expert technical interviewer conducting a mock interview for the role of "${roleContext}".
The candidate just said: "${text}".
${codeContext}
${cvContext}
Respond concisely as an interviewer. Only ask questions related to the "${roleContext}" role and their answers/CV/Code. Evaluate their approach or code, but YOU MUST ALWAYS END YOUR RESPONSE WITH A FOLLOW-UP QUESTION to advance the interview. Keep it conversational. Do not output markdown. Keep your responses under 3 sentences if possible. ALWAYS ask a question.`;
                
                const generationConfig = {
                    temperature: 0.9,
                    topP: 1,
                    topK: 1,
                    maxOutputTokens: 2048,
                };

                const safetySettings = [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                ];

                const model = genAI.getGenerativeModel({
                    model: "gemini-2.5-flash",
                    generationConfig,
                    safetySettings
                });
                
                // Keep track of chat history in the roomMap
                if (!roomMap[roomId].chatHistory) {
                     roomMap[roomId].chatHistory = [
                         {
                             role: "user",
                             parts: [{ text: "how r u" }]
                         },
                         {
                             role: "model",
                             parts: [{ text: "I am an AI language model, so I don't have feelings or experiences like humans do. However, I'm functioning well and ready to assist you. How can I help you today?" }]
                         }
                     ];
                }
                
                const chatSession = model.startChat({
                     history: roomMap[roomId].chatHistory
                });

                const response = await chatSession.sendMessage(systemInstruction);

                // Get text via the helper function provided by @google/generative-ai
                const replyText = response.response.text();
                
                // Append this exchange to the history so context is maintained
                roomMap[roomId].chatHistory.push({ role: "user", parts: [{ text: systemInstruction }] });
                roomMap[roomId].chatHistory.push({ role: "model", parts: [{ text: replyText }] });

                // Send response back
                if (typeof cb === 'function') {
                    cb({
                        success: true,
                        replyText: replyText
                    });
                }
                mockIo.to(roomId).emit('ai_response', { text: replyText });

            } catch (err) {
                console.error("[MockInterview] AI Voice Error Detailed:", err);
                if (typeof cb === 'function') cb({ error: "Failed to generate AI response: " + err.message });
                socket.emit('ai_error', { message: "AI failed to respond: " + err.message });
            }
        });

        socket.on('end_interview', ({ roomId }) => {
            if (roomMap[roomId] && String(roomMap[roomId].creatorUserId) === String(socket.user._id)) {
                mockIo.to(roomId).emit('room_invalidated', { message: 'The creator has ended this interview.' });
                delete roomMap[roomId];
                deadRooms.add(roomId);
            }
        });

        socket.on('disconnect', (reason) => {
            const roomId = socket.roomId;
            if (roomId && roomMap[roomId]) {
                roomMap[roomId].users = roomMap[roomId].users.filter(u => u.socketId !== socket.id);
                socket.to(roomId).emit('user_left', { socketId: socket.id });

                if (socket.mode === 'peer' && String(roomMap[roomId].creatorUserId) === String(socket.user._id)) {
                    // Emit event to all users that creator left, so everyone is kicked out
                    mockIo.to(roomId).emit('room_invalidated', { message: 'The creator has ended this interview or disconnected.' });
                    delete roomMap[roomId]; // Destroy the room
                    deadRooms.add(roomId);
                } else if (roomMap[roomId].users.length === 0 || (roomMap[roomId].users.length === 1 && roomMap[roomId].users[0].isAI)) {
                    // Clean up room if empty
                    delete roomMap[roomId];
                }
            }
        });
    });
};

module.exports = { initMockInterviewSocket };
