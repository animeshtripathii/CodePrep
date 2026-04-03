const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const sendContactUsInboundEmail = async (senderName, senderEmail, subject, message) => {
    const apiKey = process.env.BREVO_API_KEY;
    const adminEmail = process.env.EMAIL_USER;

    if (!apiKey || !adminEmail) {
        throw new Error('Email service not configured for incoming messages.');
    }

    const emailData = {
        // Keep sender as verified mailbox for better Brevo/Gmail deliverability.
        sender: { name: 'CodePrep Contact', email: adminEmail },
        to: [{ email: adminEmail }],
        replyTo: { name: senderName || 'Website User', email: senderEmail },
        subject: `[Contact Us] ${subject}`,
        htmlContent: `
            <div style="font-family:Segoe UI,Tahoma,sans-serif;background:#f8fafc;padding:24px;">
                <div style="max-width:600px;margin:auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                    <div style="padding:20px 24px;background:linear-gradient(135deg,#6366f1,#2563eb);color:white;">
                        <h2 style="margin:0;font-size:20px;">New Contact Us / Suggestion Message</h2>
                    </div>
                    <div style="padding:24px;color:#334155;">
                        <p><strong>From:</strong> ${senderName} (${senderEmail})</p>
                        <p><strong>Subject:</strong> ${subject}</p>
                        <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0;">
                        <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
                    </div>
                </div>
            </div>
        `,
    };

    try {
        await axios.post(BREVO_API_URL, emailData, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Brevo API Contact Email Error:', error.response?.data || error.message);
        throw new Error('Failed to send contact message.');
    }
};

module.exports = { sendContactUsInboundEmail };
