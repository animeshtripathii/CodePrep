const express = require('express')
const authRouter = express.Router();
<<<<<<< HEAD
const { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth, forgotPassword, resetPassword } = require('../controllers/authController');
=======
<<<<<<< HEAD
const { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth,updateProfile } = require('../controllers/authController');
=======
const { register, login, logout, getProfile, adminRegister, deleteProfile, getDashboardStats, checkAuth } = require('../controllers/authController');
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
const userMiddleware = require('../middleware/userMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

//userRegister
authRouter.post('/register', register);
//login
authRouter.post('/login', login);

<<<<<<< HEAD
//logout\
authRouter.post('/logout', userMiddleware, logout);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
=======
//logout
authRouter.post('/logout', userMiddleware, logout);
authRouter.delete('/deleteProfile', userMiddleware, deleteProfile);
<<<<<<< HEAD
authRouter.patch('/updateProfile', userMiddleware, updateProfile);  
=======
>>>>>>> 7b7a4e10a74f2c78a63df608b24ef7c1a39337f1
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03
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

<<<<<<< HEAD
// Password Reset (public — no auth needed)
authRouter.post('/forgot-password', forgotPassword);
authRouter.post('/reset-password/:token', resetPassword);

=======
>>>>>>> d0be5095442f234e898dc4470caea6ce6adfdc03

module.exports = authRouter;
