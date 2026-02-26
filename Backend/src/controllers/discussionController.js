const ChatMessage = require('../models/ChatMessage');

const getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { lastMessageId } = req.query;

        // Base query
        const query = { roomId };

        // If lastMessageId is provided, fetch messages older than it
        if (lastMessageId) {
            query._id = { $lt: lastMessageId };
        }

        // 1. Sort by _id -1 (newest first)
        // 2. Limit to 20
        // 3. Populate sender info
        const messages = await ChatMessage.find(query)
            .sort({ _id: -1 })
            .limit(20)
            .populate('senderId', 'firstName emailId');

        // Note: they come out in descending order (newest ... oldest of the batch).
        // The frontend usually needs them chronologically to render top-down,
        // so we reverse the array before sending.
        const reversedMessages = messages.reverse();

        res.status(200).json({
            success: true,
            messages: reversedMessages,
            hasMore: reversedMessages.length === 20 // boolean flag useful for UI
        });

    } catch (error) {
        console.error("Chat History Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching history." });
    }
};

module.exports = {
    getChatHistory
};
