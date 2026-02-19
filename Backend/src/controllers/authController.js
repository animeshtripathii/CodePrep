const authService = require('../services/authService');
const validate = require("../utils/validator");

const register = async (req, res) => {
  try {
    validate(req.body);
    const { newUser, token } = await authService.registerUser(req.body);

    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    const reply = {
      firstName: newUser.firstName,
      emailId: newUser.emailId,
      _id: newUser._id,
      role: newUser.role
    }
    res.status(201).json({
      message: "User registered successfully",
      user: reply
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { existingUser, token } = await authService.loginUser(req.body.emailId, req.body.password);

    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    const reply = {
      firstName: existingUser.firstName,
      emailId: existingUser.emailId,
      _id: existingUser._id,
      problemSolved: existingUser.problemSolved,
      role: existingUser.role
    }
    res.status(200).json({
      message: 'Login successful',
      user: reply
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const { token } = req.cookies;
    await authService.logoutUser(token);
    res.cookie('token', null, { expires: new Date(Date.now()) });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(503).json({ message: 'Logout failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const token = req.cookies.token;
    const existingUser = await authService.verifyUserProfile(token);

    res.status(200).json({
      user: {
        firstName: existingUser.firstName,
        emailId: existingUser.emailId,
        problemSolved: existingUser.problemSolved
      }
    });
  } catch (error) {
    res.status(401).json({ message: error.message || 'Invalid or expired token' });
  }
};

const adminRegister = async (req, res) => {
  try {
    validate(req.body);
    const { newUser, token } = await authService.registerAdmin(req.body);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const deleteProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    await authService.deleteUserProfile(userId);
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete profile", error: err.message });
  }
}

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.result._id;
    const stats = await authService.getDashboardStatsService(userId);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

const checkAuth = (req, res) => {
  const reply = {
    firstName: req.result.firstName,
    emailId: req.result.emailId,
    _id: req.result._id,
    problemSolved: req.result.problemSolved,
    role: req.result.role
  }
  res.json({ message: "You are authenticated", user: reply });
};

module.exports = { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth };
