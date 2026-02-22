const express = require('express')
const authRouter = express.Router();
const { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth,updateProfile } = require('../controllers/authController');
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

//userRegister
authRouter.post('/register', register);
//login
authRouter.post('/login', login);

//logout
authRouter.post('/logout', userMiddleware, logout);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
authRouter.patch('/updateProfile', userMiddleware, updateProfile);  
authRouter.get('/dashboard', userMiddleware, getDashboardStats);

//adminRegister
//here adminMiddleware  checks whether the already logged-in user is an admin.
// Only an admin can register another admin, so we protect this route with adminMiddleware.
//first time we cassign role to a person in database directly
//
authRouter.post('/admin/register', adminMiddleware, adminRegister);


//GetProfile
authRouter.get('/getProfile', getProfile);
authRouter.get("/check", userMiddleware, checkAuth);


module.exports = authRouter;
