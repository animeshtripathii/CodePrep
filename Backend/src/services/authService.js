const user = require("../models/user");
const submission = require("../models/submission");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const redisClient = require("../config/redis");
const { sendResetPasswordEmail } = require('../utils/emailService');

const registerUser = async (userData) => {
    const { firstName, emailId, password } = userData;
    // user role is enforced in controller or here? Controller sets it. 
    // Let's keep strict logic as is. Controller set req.body.role='user'.
    // We will assume data passed here is ready to be used or we handle the role logic here if it was business logic.
    // The original code: req.body.role='user'; ... const newUser = await user.create(...)

    // password hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await user.create({
        firstName,
        emailId,
        password: hashedPassword,
        role: 'user' // Enforcing role as per original controller logic
    });

    console.log("New user registered:", newUser);

    const token = jwt.sign(
        { _id: newUser._id, role: 'user', emailId: newUser.emailId },
        process.env.JWT_Secret_Key,
        { expiresIn: '1h' }
    );

    return { newUser, token };
};

const loginUser = async (emailId, password) => {
    if (!emailId || !password) {
        throw new Error('Email and password are required');
    }

    const existingUser = await user.findOne({ emailId });
    console.log("Login attempt for email:", existingUser);

    if (!existingUser) {
        throw new Error('Invalid Credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
        throw new Error('Invalid Credentials');
    }

    const token = jwt.sign(
        { _id: existingUser._id, role: existingUser.role, emailId: existingUser.emailId },
        process.env.JWT_Secret_Key,
        { expiresIn: '1h' }
    );

    return { existingUser, token };
};

const logoutUser = async (token) => {
    if (redisClient.isOpen) {
        try {
            const payload = jwt.decode(token);
            if (payload && payload.exp) {
                await redisClient.set(`token:${token}`, 'blocked');
                await redisClient.expireAt(`token:${token}`, payload.exp - Math.floor(Date.now() / 1000));
            }
        } catch (error) {
            console.error("Redis Error during logout:", error.message);
        }
    }
};

const verifyUserProfile = async (token) => {
    if (!token) {
        throw new Error('Authentication required');
    }
    const decoded = jwt.verify(token, process.env.JWT_Secret_Key);
    const existingUser = await user.findById(decoded._id).select('firstName emailId problemSolved tokens');

    if (!existingUser) {
        throw new Error('User not found');
    }
    return existingUser;
};

const registerAdmin = async (userData) => {
    const { firstName, emailId, password, role } = userData;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await user.create({
        firstName,
        emailId,
        password: hashedPassword,
        role: role
    });

    const token = jwt.sign(
        { _id: newUser._id, role: role, emailId: newUser.emailId },
        process.env.JWT_Secret_Key,
        { expiresIn: '1h' }
    );

    return { newUser, token };
};

const deleteUserProfile = async (userId) => {
    await user.findByIdAndDelete(userId);
    await submission.deleteMany({ userId });
};

const getDashboardStatsService = async (userId) => {
    const userData = await user.findById(userId).populate('problemSolved');

    if (!userData) {
        throw new Error("User not found");
    }

    const solvedProblems = userData.problemSolved.filter(p => p !== null);

    let totalPoints = solvedProblems.reduce((acc, problem) => {
        if (problem.difficulty === 'easy') return acc + 10;
        if (problem.difficulty === 'medium') return acc + 20;
        if (problem.difficulty === 'hard') return acc + 40;
        return acc;
    }, 0);

    const solvedCount = solvedProblems.length;

    const submissions = await submission.find({ userId: userId }).sort({ createdAt: -1 });
    const totalSubmissions = submissions.length;

    const acceptedSubmissions = submissions.filter(s =>
        s.status?.toLowerCase() === 'success' || s.status?.toLowerCase() === 'accepted'
    ).length;

    const acceptanceRate = totalSubmissions > 0
        ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)
        : 0;

    let currentStreak = 0;
    let checkDate = new Date();
    checkDate.setHours(0, 0, 0, 0);

    const submissionDays = new Set(
        submissions.map(s => {
            const d = new Date(s.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        })
    );

    while (submissionDays.has(checkDate.getTime())) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
    }

    const betterUsers = await user.countDocuments({
        'problemSolved': { $exists: true },
        $expr: { $gt: [{ $size: "$problemSolved" }, solvedCount] }
    });
    const rank = betterUsers + 1;

    const languageStats = {};
    submissions.forEach(sub => {
        if (sub.language) {
            languageStats[sub.language] = (languageStats[sub.language] || 0) + 1;
        }
    });

    const heatmapData = {};
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    submissions.forEach(sub => {
        const date = new Date(sub.createdAt);
        if (date >= oneYearAgo) {
            const dateStr = date.toISOString().split('T')[0];
            heatmapData[dateStr] = (heatmapData[dateStr] || 0) + 1;
        }
    });

    return {
        user: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            emailId: userData.emailId,
            role: userData.role,
            rank: rank,
            points: totalPoints,
            solvedCount: solvedCount,
            tokens: userData.tokens
        },
        stats: {
            totalSubmissions,
            acceptanceRate,
            currentStreak,
            languageStats,
            heatmapData
        }
    };
};

const forgotPassword = async (emailId) => {
    const existingUser = await user.findOne({ emailId });
    if (!existingUser) {
        throw new Error('No account found with that email address.');
    }

    // Generate a 32-byte hex token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash the token with SHA-256 before storing in DB
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Save hash and 15-minute expiry to user document
    existingUser.resetPasswordToken = hashedToken;
    existingUser.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await existingUser.save();

    // Build the reset URL (raw token goes in the URL, hash stays in DB)
    const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // Send the email
    await sendResetPasswordEmail(existingUser.emailId, resetUrl);

    return { message: 'Password reset link sent to your email.' };
};

const resetPassword = async (token, newPassword) => {
    // Hash the incoming token to compare with the stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token AND valid expiry
    const existingUser = await user.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!existingUser) {
        throw new Error('Invalid or expired reset token.');
    }

    // Hash the new password with bcrypt
    const saltRounds = 10;
    existingUser.password = await bcrypt.hash(newPassword, saltRounds);

    // Clear the token fields
    existingUser.resetPasswordToken = null;
    existingUser.resetPasswordExpires = null;
    await existingUser.save();

    return { message: 'Password reset successful. You can now log in.' };
};

const updateUserProfile = async (userId, updateData) => {
    const { firstName, lastName, password } = updateData;
    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (password) {
        const saltRounds = 10;
        updates.password = await bcrypt.hash(password, saltRounds);
    }

    const updatedUser = await user.findByIdAndUpdate(userId, updates, { new: true });
    if (!updatedUser) {
        throw new Error('User not found');
    }
    return updatedUser;
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    verifyUserProfile,
    registerAdmin,
    deleteUserProfile,
    getDashboardStatsService,
    forgotPassword,
    resetPassword,
    updateUserProfile
};
