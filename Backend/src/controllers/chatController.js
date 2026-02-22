const chatService = require('../services/chatService');

const codingChat = async (req, res) => {
    try {
        // Fallback checks just in case the frontend named the variable differently
        const message = req.body.message || req.body.text || req.body.prompt;
        const { code, language, problemTitle, problemDescription } = req.body;
        
        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required." });
        }

        const result = await chatService.codingChat(message, code, language, problemTitle, problemDescription);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const websiteChat = async (req, res) => {
    try {
        // Fallback checks just in case the frontend named the variable differently
        const message = req.body.message || req.body.text || req.body.prompt;
        
        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required in the request body." });
        }

        const result = await chatService.websiteChat(message, req.result); // req.result is your user data
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { codingChat, websiteChat };