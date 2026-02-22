const user = require("../models/user");
const submission = require("../models/submission");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require("../config/redis");

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
    const payload = jwt.decode(token);
    await redisClient.set(`token:${token}`, 'blocked');
    await redisClient.expireAt(`token:${token}`, payload.exp - Math.floor(Date.now() / 1000));
};

const verifyUserProfile = async (token) => {
    if (!token) {
        throw new Error('Authentication required');
    }
    const decoded = jwt.verify(token, process.env.JWT_Secret_Key);
    const existingUser = await user.findById(decoded._id).select('firstName emailId problemSolved');

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
            solvedCount: solvedCount
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

const updateProfile = async (userId, updateData) => {
    const allowedFields = ['firstName', 'lastName', 'emailId', 'password'];
    const updateFields = {};
    for (const field of allowedFields) {
        if (updateData[field]) {
            updateFields[field] = updateData[field];
        }
    }

    if (updateFields.password) {
        const saltRounds = 10;
        updateFields.password = await bcrypt.hash(updateFields.password, saltRounds);
    }

    const updatedUser = await user.findByIdAndUpdate(userId, updateFields, { new: true });
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
    updateProfile
};
