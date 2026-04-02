const { RtcTokenBuilder, RtcRole } = require('agora-token');

const generateAgoraToken = (req, res) => {
    try {
        const { channelName, uid } = req.body;

        if (!channelName) {
            return res.status(400).json({ success: false, message: 'channelName is required' });
        }

        const appId = process.env.AGORA_APP_ID;
        const appCertificate = process.env.AGORA_APP_CERTIFICATE;

        if (!appId || !appCertificate) {
            console.error('[Agora] Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE in .env');
            return res.status(500).json({ success: false, message: 'Agora credentials not configured on server.' });
        }

        const role = RtcRole.PUBLISHER;

        // Token expires in 1 hour (3600 seconds)
        const tokenExpirationInSeconds = 3600;
        const privilegeExpirationInSeconds = Math.floor(Date.now() / 1000) + tokenExpirationInSeconds;

        // uid: 0 means Agora will assign a random UID
        const uidValue = uid ? Number(uid) : 0;

        const token = RtcTokenBuilder.buildTokenWithUid(
            appId,
            appCertificate,
            channelName,
            uidValue,
            role,
            tokenExpirationInSeconds,
            privilegeExpirationInSeconds
        );

        return res.status(200).json({
            success: true,
            token,
            appId,
            uid: uidValue,
            channelName,
            expiresIn: tokenExpirationInSeconds
        });
    } catch (error) {
        console.error('[Agora] Token generation error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate Agora token.' });
    }
};

module.exports = { generateAgoraToken };
