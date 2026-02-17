const User = require("../models/user.model");
const submission = require("../models/submission.model");
const validate = require("../utils/validator.util");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require("../config/redis");
require('dotenv').config();

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
    return await bcrypt.hash(password, SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_Secret_Key, { expiresIn: '1h' });
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_Secret_Key);
};

const decodeToken = (token) => {
    return jwt.decode(token);
};

const createUser = async ({ firstName, emailId, password, role = 'user' }) => {
    validate({ firstName, emailId, password });
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
        firstName,
        emailId,
        password: hashedPassword,
        ...(role !== 'user' && { role })
    });
    return newUser;
};

const findUserByEmail = async (emailId) => {
    return await User.findOne({ emailId });
};

const findUserById = async (userId, selectFields = '') => {
    return await User.findById(userId).select(selectFields);
};

const findUserByIdPopulated = async (userId) => {
    return await User.findById(userId).populate('problemSolved');
};

const blacklistToken = async (token) => {
    const payload = decodeToken(token);
    await redisClient.set(`token:${token}`, 'blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp - Math.floor(Date.now() / 1000));
};

const deleteUserAndSubmissions = async (userId) => {
    await User.findByIdAndDelete(userId);
    await submission.deleteMany({ userId });
};

const getDashboardData = async (userId) => {
    const userData = await findUserByIdPopulated(userId);
    if (!userData) {
        return null;
    }

    // Filter out null problems (if any were deleted)
    const solvedProblems = userData.problemSolved.filter(p => p !== null);

    // Calculate Points
    const totalPoints = solvedProblems.reduce((acc, problem) => {
        if (problem.difficulty === 'easy') return acc + 10;
        if (problem.difficulty === 'medium') return acc + 20;
        if (problem.difficulty === 'hard') return acc + 40;
        return acc;
    }, 0);

    const solvedCount = solvedProblems.length;

    // Fetch ALL submissions for this user
    const submissions = await submission.find({ userId }).sort({ createdAt: -1 });
    const totalSubmissions = submissions.length;

    const acceptedSubmissions = submissions.filter(s =>
        s.status?.toLowerCase() === 'success' || s.status?.toLowerCase() === 'accepted'
    ).length;

    const acceptanceRate = totalSubmissions > 0
        ? ((acceptedSubmissions / totalSubmissions) * 100).toFixed(1)
        : 0;

    // Current Streak Calculation
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

    // Rank Calculation
    const betterUsers = await User.countDocuments({
        'problemSolved': { $exists: true },
        $expr: { $gt: [{ $size: "$problemSolved" }, solvedCount] }
    });
    const rank = betterUsers + 1;

    // Language Usage Stats
    const languageStats = {};
    submissions.forEach(sub => {
        if (sub.language) {
            languageStats[sub.language] = (languageStats[sub.language] || 0) + 1;
        }
    });

    // Heatmap Data (last 365 days)
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
            rank,
            points: totalPoints,
            solvedCount
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

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
    decodeToken,
    createUser,
    findUserByEmail,
    findUserById,
    findUserByIdPopulated,
    blacklistToken,
    deleteUserAndSubmissions,
    getDashboardData
};
