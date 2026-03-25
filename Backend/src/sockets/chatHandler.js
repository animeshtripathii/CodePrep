const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ChatMessage = require('../models/ChatMessage');
const ChatRoomStats = require('../models/ChatRoomStats');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.ChatBot_API });
const MAX_USERS_PER_SUBROOM = 50;
const MAX_ROOM_ALLOCATION_RETRIES = 6;
const configuredSocketOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'https://code-prep-beryl.vercel.app'
].filter(Boolean);
const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '');
const configuredSocketOriginSet = new Set(configuredSocketOrigins.map(normalizeOrigin));
const localhostOriginRegex = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
const lanOriginRegex = /^https?:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/i;

const isAllowedSocketOrigin = (origin) => {
    if (!origin) return true;
    const normalizedOrigin = normalizeOrigin(origin);
    if (configuredSocketOriginSet.has(normalizedOrigin)) return true;

    if (process.env.NODE_ENV !== 'production') {
        return true;
    }

    return localhostOriginRegex.test(normalizedOrigin) || lanOriginRegex.test(normalizedOrigin);
};

let io;

const ensureBaseProblemRoom = async (problemId) => {
    await ChatRoomStats.updateOne(
        { baseRoomId: problemId },
        {
            $setOnInsert: {
                baseRoomId: problemId,
                activeSubRooms: [{ subRoomId: `${problemId}-Room-1`, activeCount: 0 }]
            }
        },
        { upsert: true }
    );
};

const allocateProblemSubRoom = async (problemId) => {
    await ensureBaseProblemRoom(problemId);

    for (let attempt = 0; attempt < MAX_ROOM_ALLOCATION_RETRIES; attempt++) {
        const roomStats = await ChatRoomStats.findOne({ baseRoomId: problemId });
        if (!roomStats) continue;

        const availableRoom = roomStats.activeSubRooms.find((r) => r.activeCount < MAX_USERS_PER_SUBROOM);

        if (availableRoom) {
            const claimResult = await ChatRoomStats.updateOne(
                {
                    baseRoomId: problemId,
                    activeSubRooms: {
                        $elemMatch: {
                            subRoomId: availableRoom.subRoomId,
                            activeCount: { $lt: MAX_USERS_PER_SUBROOM }
                        }
                    }
                },
                { $inc: { "activeSubRooms.$.activeCount": 1 } }
            );

            if (claimResult.modifiedCount === 1) {
                return availableRoom.subRoomId;
            }

            continue;
        }

        const newRoomNumber = roomStats.activeSubRooms.length + 1;
        const newRoomId = `${problemId}-Room-${newRoomNumber}`;
        const createResult = await ChatRoomStats.updateOne(
            {
                baseRoomId: problemId,
                "activeSubRooms.subRoomId": { $ne: newRoomId }
            },
            {
                $push: {
                    activeSubRooms: {
                        subRoomId: newRoomId,
                        activeCount: 1
                    }
                }
            }
        );

        if (createResult.modifiedCount === 1) {
            return newRoomId;
        }
    }

    throw new Error("ROOM_ALLOCATION_FAILED");
};

const initSocketServer = (httpServer) => {
    // src/sockets/chatHandler.js example
    io = require('socket.io')(httpServer, {
        cors: {
            origin: (origin, callback) => {
                if (isAllowedSocketOrigin(origin)) {
                    return callback(null, true);
                }
                return callback(new Error('Not allowed by Socket CORS'));
            },
            credentials: true
        }
    });

    // Middleware for Auth
    io.use(async (socket, next) => {
        try {
            let token = socket.handshake.auth.token;

            // Fallback: Check cookies if token is not in auth object (common for httpOnly cookies)
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
            console.error("Socket Auth Error:", err);
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    io.on("connection", (socket) => {
        // --- JOIN PUBLIC PROBLEM ROOM (`Problem-123-Room-1`) ---
        socket.on("join_problem_room", async ({ problemId }, cb) => {
            try {
                if (!problemId || typeof problemId !== 'string') {
                    return cb({ error: "Invalid problemId." });
                }

                if (socket.baseRoom === problemId && socket.currentRoom) {
                    return cb({ success: true, roomId: socket.currentRoom });
                }

                if (socket.user.tokens < 20) {
                    return cb({ error: "Access Denied: You need at least 20 tokens to enter problem discussions." });
                }

                // If user switches problem, release previous room occupancy first.
                if (socket.currentRoom && socket.baseRoom && socket.baseRoom !== problemId) {
                    await ChatRoomStats.updateOne(
                        {
                            baseRoomId: socket.baseRoom,
                            activeSubRooms: {
                                $elemMatch: {
                                    subRoomId: socket.currentRoom,
                                    activeCount: { $gt: 0 }
                                }
                            }
                        },
                        { $inc: { "activeSubRooms.$.activeCount": -1 } }
                    );
                    socket.leave(socket.currentRoom);
                }

                const allocatedRoomId = await allocateProblemSubRoom(problemId);

                // Join the Socket.io room
                socket.join(allocatedRoomId);

                // Track internally for disconnect cleanup
                socket.currentRoom = allocatedRoomId;
                socket.baseRoom = problemId;

                cb({ success: true, roomId: allocatedRoomId });
            } catch (err) {
                console.error("Join Room Error:", err);
                cb({ error: "Failed to join room due to server error." });
            }
        });

        // --- JOIN DIRECT MESSAGE ROOM (`DM-userIdA-userIdB`) ---
        socket.on("join_dm", ({ targetUserId }, cb) => {
            try {
                // Sorted IDs to ensure both users compute the exact same string
                const ids = [socket.user._id.toString(), targetUserId.toString()].sort();
                const dmRoomId = `DM-${ids[0]}-${ids[1]}`;

                socket.join(dmRoomId);
                cb({ success: true, roomId: dmRoomId });
            } catch (err) {
                console.error("Join DM Error:", err);
                cb({ error: "Failed to join DM room." });
            }
        });

        // --- SEND MESSAGE (Free normal messages, 5 Tokens for Ask CodeBot) ---
        socket.on("sendMessage", async ({ roomId, content }, cb) => {
            try {
                const trimmedContent = String(content || '').trim();
                const isAskCodeBotMessage = trimmedContent.includes("**@CodeBot**");
                const messageTokenCost = isAskCodeBotMessage ? 5 : 0;
                if (!roomId || typeof roomId !== 'string' || !trimmedContent) {
                    return cb({ error: "Invalid roomId/content." });
                }

                // Prevent sending to rooms the socket is not a member of.
                if (!socket.rooms.has(roomId)) {
                    return cb({ error: "Unauthorized room access." });
                }

                // Sender must have enough tokens only when message has a token cost
                if (messageTokenCost > 0 && socket.user.tokens < messageTokenCost) {
                    return cb({ error: `Insufficient tokens! You need ${messageTokenCost} tokens to send this message.` });
                }

                let updatedUser = null;
                if (messageTokenCost > 0) {
                    // Safely deduct based on message type
                    updatedUser = await User.findOneAndUpdate(
                        { _id: socket.user._id, tokens: { $gte: messageTokenCost } },
                        { $inc: { tokens: -messageTokenCost } },
                        { returnDocument: 'after' }
                    );
                }

                if (messageTokenCost > 0 && !updatedUser) {
                    return cb({ error: "Failed to process token deduction." });
                }

                // Keep socket token state in sync when a deduction happened
                if (updatedUser) {
                    socket.user.tokens = updatedUser.tokens;
                }

                // Create the message in MongoDB
                let newMessage;
                try {
                    newMessage = await ChatMessage.create({
                        senderId: socket.user._id,
                        roomId,
                        content: trimmedContent
                    });
                } catch (messageErr) {
                    // Best-effort refund to avoid losing tokens if write fails after deduction.
                    if (messageTokenCost > 0) {
                        await User.updateOne(
                            { _id: socket.user._id },
                            { $inc: { tokens: messageTokenCost } }
                        );
                        socket.user.tokens += messageTokenCost;
                    }
                    throw messageErr;
                }

                // Populate sender info for the frontend
                await newMessage.populate('senderId', 'firstName emailId');

                // Broadcast to everyone in the room (including sender if desired, or skip sender)
                io.to(roomId).emit("newMessage", newMessage);

                // Acknowledge exactly to the sender -> "Delivered" and updated token balance
                cb({
                    success: true,
                    status: 'delivered',
                    message: newMessage,
                    tokensRemaining: socket.user.tokens
                });

                // --- AI RESPONSE: If message contains @CodeBot, call Gemini ---
                if (isAskCodeBotMessage) {
                    try {
                        const userQuestion = trimmedContent.replace("**@CodeBot**", "").trim();

                        const response = await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: userQuestion,
                            config: {
                                systemInstruction: `You are CodeBot, a helpful DSA tutor in a discussion forum. 
Keep your answers concise and helpful. Use markdown formatting.
If asked about code, provide clear explanations with code examples.
Focus only on programming and DSA topics.`
                            }
                        });

                        const aiContent = `**@CodeBot**\n\n${response.text}`;

                        // Save AI response as a system message
                        let aiMessage = await ChatMessage.create({
                            senderId: socket.user._id, // attribute to the requester
                            roomId,
                            content: aiContent
                        });

                        await aiMessage.populate('senderId', 'firstName emailId');

                        // Override the sender info for display purposes
                        const aiPayload = aiMessage.toObject();
                        aiPayload.senderId = {
                            _id: 'ai-codebot',
                            firstName: 'CodeBot AI'
                        };

                        // Broadcast AI response to the room
                        io.to(roomId).emit("newMessage", aiPayload);
                    } catch (aiErr) {
                        console.error("Gemini AI Error:", aiErr);
                        // Send error message to room
                        const errorPayload = {
                            _id: `ai-error-${Date.now()}`,
                            senderId: { _id: 'ai-codebot', firstName: 'CodeBot AI' },
                            roomId,
                            content: "**@CodeBot**\n\nSorry, I couldn't process your request right now. Please try again.",
                            createdAt: new Date()
                        };
                        io.to(roomId).emit("newMessage", errorPayload);
                    }
                }

            } catch (err) {
                console.error("Send Message Error:", err);
                cb({ error: "Failed to send message." });
            }
        });

        socket.on("disconnect", async () => {
            if (socket.currentRoom && socket.baseRoom) {
                try {
                    // Decrement room stats logically
                    await ChatRoomStats.updateOne(
                        {
                            baseRoomId: socket.baseRoom,
                            activeSubRooms: {
                                $elemMatch: {
                                    subRoomId: socket.currentRoom,
                                    activeCount: { $gt: 0 }
                                }
                            }
                        },
                        { $inc: { "activeSubRooms.$.activeCount": -1 } }
                    );
                } catch (e) {
                    console.error("Cleanup error on disconnect:", e);
                }
            }
        });
    });
};

const getIo = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

module.exports = { initSocketServer, getIo };
