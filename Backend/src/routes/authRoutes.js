const express = require('express')
const authRouter = express.Router();
const {
	register,
	login,
	logout,
	getProfile,
	adminRegister,
	deleteProfile,
	getDashboardStats,
	checkAuth,
	forgotPassword,
	resetPassword,
	updateProfile,
	requestSignupOtp,
	verifySignupOtp,
	requestEmailUpdateOtp,
	verifyEmailUpdateOtp
} = require('../controllers/authController');
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const loginSignupLimiter = require('../middleware/loginSignupLimiter');

//userRegister
authRouter.post('/register', register);
//login
authRouter.post('/login', loginSignupLimiter, login);

//logout
authRouter.post('/logout', userMiddleware, logout);
authRouter.patch('/updateProfile', userMiddleware, updateProfile);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.get('/dashboard', userMiddleware, getDashboardStats);

//adminRegister
//here adminMiddleware checks whether the already logged-in user is an admin.
// Only an admin can register another admin, so we protect this route with adminMiddleware.
authRouter.post('/admin/register', adminMiddleware, adminRegister);

//GetProfile
authRouter.get('/getProfile', userMiddleware, getProfile);
authRouter.get("/check", userMiddleware, checkAuth);

// Password Reset (public — no auth needed)
authRouter.post('/forgot-password', loginSignupLimiter, forgotPassword);
authRouter.post('/reset-password/:token', loginSignupLimiter, resetPassword);
authRouter.post('/signup', loginSignupLimiter, register);
authRouter.post('/signup/request-otp', loginSignupLimiter, requestSignupOtp);
authRouter.post('/signup/verify-otp', loginSignupLimiter, verifySignupOtp);
authRouter.post('/email-update/request-otp', userMiddleware, requestEmailUpdateOtp);
authRouter.post('/email-update/verify-otp', userMiddleware, verifyEmailUpdateOtp);

module.exports = authRouter;
