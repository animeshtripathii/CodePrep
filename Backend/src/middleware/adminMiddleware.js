const jwt=require('jsonwebtoken');
const User=require('../models/user');
const redisClient=require('../config/redis');
const adminMiddleware=async(req,res,next)=>{
    try {
        const {token}=req.cookies;
        if(!token){
            throw new Error('Login required');
        }
          const payload=  jwt.verify(token,process.env.JWT_Secret_Key)
          const {_id}=payload;
          if(!_id){
            throw new Error('Invalid token');
          }
          const result= await User.findById(_id);
           if(!result) {
                throw new Error('User not found');
            }
            if(payload.role != 'admin') {
                throw new Error('Admin access required');
            }
          //check the user is present in redis black list or not
          const isBlocked= await redisClient.exists(`token:${token}`);

          if(isBlocked){
            throw new Error('Invalid token');
          }
          req.result=result;
          next();   
        } catch (error) {
          res.status(401).json({ message: error.message });
        }
    }
    module.exports=adminMiddleware;