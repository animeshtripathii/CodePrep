const express=require('express')
const authRouter=express.Router();
const {register,login,logout,getProfile,adminRegister}=require('../Controllers/userAuthent');
const userMiddleware=require('../middleware/userMiddleware');
const adminMiddleware=require('../middleware/adminMiddleware');

//userRegister
authRouter.post('/register',register);

//adminRegister
authRouter.post('/admin/register',adminMiddleware,adminRegister);
//login
authRouter.post('/login',login);
//logout
authRouter.post('/logout',userMiddleware, logout);
//GetProfile
 authRouter.get('/getProfile',getProfile);


module.exports=authRouter;



