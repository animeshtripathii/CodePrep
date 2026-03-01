const nodemailer = require('nodemailer');

// backend/src/services/emailService.js
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Forced IPv4 to avoid the IPv6 routing issues seen in your logs
    family: 4, 
    // Increased timeouts to give the cloud network more time to respond
    connectionTimeout: 10000, 
    greetingTimeout: 10000,
    socketTimeout: 10000
});
transporter.verify(function (error, success) {
    if (error) {
        console.error("Nodemailer Transporter Verification Failed:", error);
    } else {
        console.log("Nodemailer: Server is ready to take our messages");
    }
});


const sendResetPasswordEmail = async (to, resetUrl) => {
    try {
        const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9; padding:40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding:32px 40px; text-align:center;">
                                <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700; letter-spacing:-0.5px;">CodePrep</h1>
                                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Password Reset Request</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 20px;">
                                    Hi there! We received a request to reset your password. Click the button below to choose a new one.
                                </p>
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                    <tr>
                                        <td align="center" style="padding:8px 0 24px;">
                                            <a href="${resetUrl}" 
                                               style="display:inline-block; background-color:#16a34a; color:#ffffff; text-decoration:none; font-weight:700; font-size:14px; padding:14px 36px; border-radius:8px; letter-spacing:0.3px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0 0 16px;">
                                    This link will expire in <strong style="color:#334155;">15 minutes</strong>. If you didn't request this, you can safely ignore this email.
                                </p>
                                <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;">
                                <p style="color:#94a3b8; font-size:11px; line-height:1.5; margin:0;">
                                    If the button doesn't work, copy and paste this link:<br>
                                    <a href="${resetUrl}" style="color:#16a34a; word-break:break-all;">${resetUrl}</a>
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
                                <p style="color:#94a3b8; font-size:11px; margin:0;">© ${new Date().getFullYear()} CodePrep. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

        await transporter.sendMail({
            from: `"CodePrep" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Reset Your Password — CodePrep',
            html: htmlBody
        });
        console.log(`Reset email sent to ${to}`);
    } catch (error) {
        console.error("sendResetPasswordEmail Error:", error);
        throw error;
    }
};

/**
 * Send plan activation / token credit email.
 * @param {string} to - Recipient email
 * @param {object} details - { planName, tokensAdded, baseTokens, bonusTokens, totalBalance, amountPaid, userName }
 */
const sendPlanActivationEmail = async (to, details) => {
    const { planName, tokensAdded, baseTokens, bonusTokens, totalBalance, amountPaid, userName } = details;

    const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9; padding:40px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding:32px 40px; text-align:center;">
                                <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:700;">CodePrep</h1>
                                <p style="color:rgba(255,255,255,0.85); margin:8px 0 0; font-size:14px;">Plan Activated Successfully 🎉</p>
                            </td>
                        </tr>
                        <!-- Body -->
                        <tr>
                            <td style="padding:40px;">
                                <p style="color:#334155; font-size:15px; line-height:1.6; margin:0 0 24px;">
                                    Hi <strong>${userName || 'there'}</strong>! Your <strong>${planName}</strong> plan has been activated. Here are the details:
                                </p>

                                <!-- Details Table -->
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; margin-bottom:24px;">
                                    <tr style="background-color:#f8fafc;">
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0;">Plan</td>
                                        <td style="padding:12px 16px; font-size:13px; color:#0f172a; font-weight:600; text-align:right; border-bottom:1px solid #e2e8f0;">${planName}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0;">Base Tokens</td>
                                        <td style="padding:12px 16px; font-size:13px; color:#0f172a; font-weight:600; text-align:right; border-bottom:1px solid #e2e8f0;">${baseTokens}</td>
                                    </tr>
                                    ${bonusTokens > 0 ? `
                                    <tr style="background-color:#f0fdf4;">
                                        <td style="padding:12px 16px; font-size:13px; color:#16a34a; border-bottom:1px solid #e2e8f0;">🎁 Bonus Tokens</td>
                                        <td style="padding:12px 16px; font-size:13px; color:#16a34a; font-weight:600; text-align:right; border-bottom:1px solid #e2e8f0;">+${bonusTokens}</td>
                                    </tr>` : ''}
                                    <tr>
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0;">Total Tokens Added</td>
                                        <td style="padding:12px 16px; font-size:14px; color:#16a34a; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${tokensAdded}</td>
                                    </tr>
                                    <tr style="background-color:#f8fafc;">
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b; border-bottom:1px solid #e2e8f0;">Your New Balance</td>
                                        <td style="padding:12px 16px; font-size:14px; color:#0f172a; font-weight:700; text-align:right; border-bottom:1px solid #e2e8f0;">${totalBalance} tokens</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:12px 16px; font-size:13px; color:#64748b;">Amount Paid</td>
                                        <td style="padding:12px 16px; font-size:13px; color:#0f172a; font-weight:600; text-align:right;">₹${amountPaid}</td>
                                    </tr>
                                </table>

                                <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0 0 8px;">
                                    Your tokens are ready to use! Head to CodePrep and start solving problems.
                                </p>
                                <p style="color:#94a3b8; font-size:11px; margin:0;">
                                    Activated on ${new Date().toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kolkata' })}
                                </p>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td style="background-color:#f8fafc; padding:20px 40px; text-align:center; border-top:1px solid #e2e8f0;">
                                <p style="color:#94a3b8; font-size:11px; margin:0;">© ${new Date().getFullYear()} CodePrep. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;

    await transporter.sendMail({
        from: `"CodePrep" <${process.env.EMAIL_USER}>`,
        to,
        subject: `✅ ${planName} Plan Activated — CodePrep`,
        html: htmlBody
    });
};

module.exports = { sendResetPasswordEmail, sendPlanActivationEmail };
