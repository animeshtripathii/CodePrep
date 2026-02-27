const express = require('express')
const authRouter = express.Router();
const { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth, forgotPassword, resetPassword } = require('../controllers/authController');
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

//userRegister
authRouter.post('/register', register);
//login
const loginSignupLimiter = require('../middleware/loginSignupLimiter');
authRouter.post('/login', loginSignupLimiter, login);

//logout
authRouter.post('/logout', userMiddleware, logout);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.get('/dashboard', userMiddleware, getDashboardStats);

//adminRegister
//here adminMiddleware checks whether the already logged-in user is an admin.
// Only an admin can register another admin, so we protect this route with adminMiddleware.
authRouter.post('/admin/register', adminMiddleware, adminRegister);

//GetProfile
authRouter.get('/getProfile', getProfile);
authRouter.get("/check", userMiddleware, checkAuth);

// Password Reset (public — no auth needed)
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);
authRouter.post('/signup', loginSignupLimiter, register);

module.exports = authRouter;
