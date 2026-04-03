const express = require('express');
const router = express.Router();
const { sendContactUsInboundEmail } = require('../utils/contactEmailService');

router.post('/submit', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: 'All fields are required.' });
        }

        await sendContactUsInboundEmail(name, email, subject, message);

        res.status(200).json({ success: true, message: 'Message sent successfully.' });
    } catch (error) {
        console.error('Contact Submission Error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
    }
});

module.exports = router;
