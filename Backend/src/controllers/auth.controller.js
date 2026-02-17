const authService = require("../services/auth.service");

const register = async (req, res) => {
  try {
    const { firstName, emailId, password } = req.body;
    req.body.role = 'user'; // enforce role to be 'user' only

    const newUser = await authService.createUser({ firstName, emailId, password });
    console.log("New user registered:", newUser);

    const token = authService.generateToken({
      _id: newUser._id, role: 'user', emailId: newUser.emailId
    });

    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    const reply = {
      firstName: newUser.firstName,
      emailId: newUser.emailId,
      _id: newUser._id,
      problemSolved: [],
      role: newUser.role
    };

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
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error('Email and password are required');
    }

    const existingUser = await authService.findUserByEmail(emailId);
    console.log("Login attempt for email:", existingUser);

    if (!existingUser) {
      throw new Error('Invalid Credentials');
    }

    const isPasswordValid = await authService.comparePassword(password, existingUser.password);
    if (!isPasswordValid) {
      throw new Error('Invalid Credentials');
    }

    const token = authService.generateToken({
      _id: existingUser._id, role: existingUser.role, emailId: existingUser.emailId
    });

    res.cookie('token', token, {
      maxAge: 60 * 60 * 1000 // 1 hour
    });

    const reply = {
      firstName: existingUser.firstName,
      emailId: existingUser.emailId,
      _id: existingUser._id,
      problemSolved: existingUser.problemSolved,
      role: existingUser.role
    };

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
    await authService.blacklistToken(token);
    res.cookie('token', null, { expires: new Date(Date.now()) });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(503).json({ message: 'Logout failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    let token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = authService.verifyToken(token);
    const existingUser = await authService.findUserById(decoded._id, 'firstName emailId problemSolved');
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        firstName: existingUser.firstName,
        emailId: existingUser.emailId,
        problemSolved: existingUser.problemSolved
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const adminRegister = async (req, res) => {
  try {
    const { firstName, emailId, password, role } = req.body;

    const newUser = await authService.createUser({ firstName, emailId, password, role });

    const token = authService.generateToken({
      _id: newUser._id, role, emailId: newUser.emailId
    });

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
    await authService.deleteUserAndSubmissions(userId);
    res.status(200).json({ message: "Profile deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete profile", error: err.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.result._id;
    const dashboardData = await authService.getDashboardData(userId);

    if (!dashboardData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Failed to fetch dashboard stats", error: error.message });
  }
};

module.exports = { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats };
