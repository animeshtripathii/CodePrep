const authService = require('../services/authService');
const validate = require("../utils/validator");

const register = async (req, res) => {
  try {
    validate(req.body);
    const { newUser, token } = await authService.registerUser(req.body);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 60 * 60 * 1000
    });

    const reply = {
      firstName: newUser.firstName,
      emailId: newUser.emailId,
      _id: newUser._id,
      role: newUser.role,
      tokens: newUser.tokens,
      token: token
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

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction, // Render provides HTTPS, localhost is HTTP
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 60 * 60 * 1000
    });

    const reply = {
      firstName: existingUser.firstName,
      emailId: existingUser.emailId,
      _id: existingUser._id,
      problemSolved: existingUser.problemSolved,
      role: existingUser.role,
      tokens: existingUser.tokens
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

    // Attempt to blacklist the token in Redis, but don't let it block the response
    if (token) {
      authService.logoutUser(token).catch(err => console.error("Logout Service Error:", err.message));
    }

    // Determine environment-specific cookie options
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      expires: new Date(0) // Immediately expire
    };

    res.clearCookie('token', cookieOptions);
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error("Logout Controller Error:", error);
    res.status(500).json({ message: 'Logout failed', error: error.message });
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
        problemSolved: existingUser.problemSolved,
        tokens: existingUser.tokens
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

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'None' : 'Lax',
      maxAge: 60 * 60 * 1000
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
    role: req.result.role,
    tokens: req.result.tokens
  }
  res.json({ message: "You are authenticated", user: reply });
};

const forgotPassword = async (req, res) => {
  try {
    const { emailId } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: 'Email is required.' });
    }
    const result = await authService.forgotPassword(emailId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required.' });
    }
    const result = await authService.resetPassword(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const updatedUser = await authService.updateUserProfile(userId, req.body);
    res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth, forgotPassword, resetPassword, updateProfile };
