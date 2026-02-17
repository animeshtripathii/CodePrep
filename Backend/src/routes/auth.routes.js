const express=require('express')
const authRouter=express.Router();
const {register,login,logout,getProfile,adminRegister,deleteProfile, getDashboardStats}=require('../controllers/auth.controller');
const userMiddleware=require('../middlewares/user.middleware');
const adminMiddleware=require('../middlewares/admin.middleware');

//userRegister
authRouter.post('/register',register);
//login
authRouter.post('/login',login);

//logout
authRouter.post('/logout',userMiddleware, logout);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.get('/dashboard', userMiddleware, getDashboardStats);

//adminRegister
//here adminMiddleware  checks whether the already logged-in user is an admin.
// Only an admin can register another admin, so we protect this route with adminMiddleware.
//first time we cassign role to a person in database directly
//
authRouter.post('/admin/register',adminMiddleware,adminRegister);


//GetProfile
 authRouter.get('/getProfile',getProfile);
authRouter.get("/check",userMiddleware,(req,res)=>{
    const reply={
    firstName:req.result.firstName,
    emailId: req.result.emailId,
    _id:req.result._id,
    problemSolved: req.result.problemSolved,
    role:req.result.role
    }
    res.json({message:"You are authenticated",user:reply});
});


module.exports=authRouter;
