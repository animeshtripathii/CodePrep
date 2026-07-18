const chatService = require('../services/chatService');

const codingChat = async (req, res) => {
    try {
        const message = req.body.message || req.body.text || req.body.prompt;
        const { code, language, problemTitle, problemDescription } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required." });
        }

        const result = await chatService.codingChat(message, code, language, problemTitle, problemDescription, req.result);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const websiteChat = async (req, res) => {
    try {
        const message = req.body.message || req.body.text || req.body.prompt;

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required in the request body." });
        }

        const result = await chatService.websiteChat(message, req.result);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

<<<<<<< HEAD
const interviewChat = async (req, res) => {
    try {
        const message = req.body.message || req.body.text || req.body.prompt;
        const { history, problemTitle, problemDescription, code, language, cvFileName } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required." });
        }

        const result = await chatService.interviewChat(message, history, problemTitle, problemDescription, code, language, cvFileName, req.result);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { codingChat, websiteChat, interviewChat };
=======
module.exports = { codingChat, websiteChat };
>>>>>>> 4c7510c4037886edc05d8b2d5844dc36ed14d532
