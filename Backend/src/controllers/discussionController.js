const ChatMessage = require('../models/ChatMessage');

const getChatHistory = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { lastMessageId } = req.query;

        // Base query
        const query = { roomId };

        if (lastMessageId) {
            query._id = { $lt: lastMessageId };
        }

        const messages = await ChatMessage.find(query)
            .sort({ _id: -1 })
            .limit(20)
            .populate('senderId', 'firstName emailId');

        const reversedMessages = messages.reverse();

        res.status(200).json({
            success: true,
            messages: reversedMessages,
            hasMore: reversedMessages.length === 20
        });

    } catch (error) {
        console.error("Chat History Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching history." });
    }
};

module.exports = {
    getChatHistory
};
