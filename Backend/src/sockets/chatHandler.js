const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const ChatMessage = require('../models/ChatMessage');
const ChatRoomStats = require('../models/ChatRoomStats');
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.ChatBot_API });

let io;

const initSocketServer = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:5173"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log("Socket.io initialized for Discussions");

    // Middleware for Auth
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) return next(new Error("Authentication error: No token"));

            const decoded = jwt.verify(token, process.env.JWT_Secret_Key);
            const user = await User.findById(decoded._id);
            if (!user) return next(new Error("Authentication error: User not found"));

            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Authentication error: Invalid Token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`User connected to Chat: ${socket.user.firstName}`);

        // --- JOIN PUBLIC PROBLEM ROOM (`Problem-123-Room-1`) ---
        socket.on("join_problem_room", async ({ problemId }, cb) => {
            try {
                if (socket.user.tokens < 20) {
                    return cb({ error: "Access Denied: You need at least 20 tokens to enter problem discussions." });
                }

                // Dynamic Room Allocation Logic (max 50 per sub-room)
                let roomStats = await ChatRoomStats.findOne({ baseRoomId: problemId });
                if (!roomStats) {
                    roomStats = await ChatRoomStats.create({
                        baseRoomId: problemId,
                        activeSubRooms: [{ subRoomId: `${problemId}-Room-1`, activeCount: 0 }]
                    });
                }

                // Find a room with < 50 users
                let availableRoom = roomStats.activeSubRooms.find(r => r.activeCount < 50);

                if (!availableRoom) {
                    // Create a new sub-room
                    const newRoomNumber = roomStats.activeSubRooms.length + 1;
                    const newRoomId = `${problemId}-Room-${newRoomNumber}`;
                    roomStats.activeSubRooms.push({ subRoomId: newRoomId, activeCount: 0 });
                    await roomStats.save();
                    availableRoom = roomStats.activeSubRooms[roomStats.activeSubRooms.length - 1];
                }

                // Join the Socket.io room
                socket.join(availableRoom.subRoomId);

                // Track internally for disconnect cleanup
                socket.currentRoom = availableRoom.subRoomId;
                socket.baseRoom = problemId;

                // Increment active count
                await ChatRoomStats.updateOne(
                    { baseRoomId: problemId, "activeSubRooms.subRoomId": availableRoom.subRoomId },
                    { $inc: { "activeSubRooms.$.activeCount": 1 } }
                );

                cb({ success: true, roomId: availableRoom.subRoomId });
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

        // --- SEND MESSAGE (Deducts 2 Tokens) ---
        socket.on("sendMessage", async ({ roomId, content }, cb) => {
            try {
                // Sender must have at least 2 tokens
                if (socket.user.tokens < 2) {
                    return cb({ error: "Insufficient tokens! You need 2 tokens to send a message." });
                }

                // Safely deduct 2 tokens
                const updatedUser = await User.findOneAndUpdate(
                    { _id: socket.user._id, tokens: { $gte: 2 } },
                    { $inc: { tokens: -2 } },
                    { new: true }
                );

                if (!updatedUser) {
                    return cb({ error: "Failed to process token deduction." });
                }

                // Update local socket state to prevent multiple sends if tokens drop to 0
                socket.user.tokens = updatedUser.tokens;

                // Create the message in MongoDB
                let newMessage = await ChatMessage.create({
                    senderId: socket.user._id,
                    roomId,
                    content
                });

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
                if (content.includes("**@CodeBot**")) {
                    try {
                        const userQuestion = content.replace("**@CodeBot**", "").trim();

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
            console.log(`User disconnected from Chat: ${socket.user.username}`);
            if (socket.currentRoom && socket.baseRoom) {
                try {
                    // Decrement room stats logically
                    await ChatRoomStats.updateOne(
                        { baseRoomId: socket.baseRoom, "activeSubRooms.subRoomId": socket.currentRoom },
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
