const user = require("../models/user");
const submission = require("../models/submission");
const validate = require("../utils/validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require("../config/redis");
require('dotenv').config();

const register = async (req, res) => {
  try {
    //validation of data
    validate(req.body);
    const { firstName, emailId, password } = req.body;
    req.body.role='user'; // enforce role to be 'user' only
 
    // password hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user by explicitly naming fields to avoid Mass Assignment vulnerability
    const newUser = await user.create({
      firstName,
      emailId,
      password: hashedPassword
    });
    const token = jwt.sign(
      { _id: newUser._id, role:'user', emailId: newUser.emailId }, 
      process.env.JWT_Secret_Key, 
      { expiresIn: '1h' }
    );
    res.cookie('token', token, {
      // httpOnly: true,
      // secure should be true only in production (requires HTTPS)
      // secure: process.env.NODE_ENV === 'production',
      // sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    // Redirect to login page after successful registration
    const reply={
      firstName: newUser.firstName,
      emailId: newUser.emailId,
      _id: newUser._id
    }
    res.status(201).json({
      message: "User registered successfully",
      user: reply
    });
  } catch(error){
    res.status(400).json({ message: error.message });
  }
};

const login = async (req, res) => {
  // Login logic here
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      throw new Error('Invalid credentials');
    }

    const existingUser = await user.findOne({ emailId: emailId });

    // Security best practice: Use generic error messages to prevent account enumeration
    if (!existingUser) {
      throw new Error('Invalid Credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, existingUser.password);

    if (!isPasswordValid) {
      throw new Error('Invalid Credentials');
    }

    //jwt token generation
    const token = jwt.sign(
      { _id: existingUser._id, role:existingUser.role, emailId: existingUser.emailId }, 
      process.env.JWT_Secret_Key, 
      { expiresIn: '1h' }
    );

    //cookie set
    res.cookie('token', token, {
      // httpOnly: true,
      // secure should be true only in production (requires HTTPS)
      //secure: process.env.NODE_ENV === 'production', 
      //sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    const reply={
      firstName: existingUser.firstName,
      emailId: existingUser.emailId,
      _id: existingUser._id
    }
    res.status(200).json({ 
        message: 'Login successful',
        user:reply
    });

  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

const logout = async (req, res) => {
  try{
  const { token } = req.cookies;
   const payload=jwt.decode(token);
   await redisClient.set(`token:${token}`, 'blocked')
    await redisClient.expireAt(`token:${token}`, payload.exp - Math.floor(Date.now() / 1000));
    res.cookie('token',null,{expires: new Date(Date.now())});
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    res.status(503).json({ message: 'Logout failed', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    let token=req.cookies.token
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify JWT and extract user id
    const decoded = jwt.verify(token, process.env.JWT_Secret_Key);

    const existingUser = await user.findById(decoded._id).select('firstName emailId problemSolved ');
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
    // Hide detailed error information from the client
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const adminRegister= async (req, res) => {
try {
    //validation of data
    validate(req.body);
    const { firstName, emailId, password } = req.body;
 
    // password hashing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user by explicitly naming fields to avoid Mass Assignment vulnerability
    const newUser = await user.create({
      firstName,
      emailId,
      password: hashedPassword,
      role:req.body.role
    });
    const token = jwt.sign(
      { _id: newUser._id, role:req.body.role, emailId: newUser.emailId }, 
      process.env.JWT_Secret_Key, 
      { expiresIn: '1h' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      // secure should be true only in production (requires HTTPS)
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    // Redirect to login page after successful registration
    res.status(201).json({
      message: "User registered successfully",
    });
  } catch(error){
    res.status(400).json({ message: error.message });
  }
};

const deleteProfile=async(req,res)=>{
  try{
const userId=req.result._id;
//user delted from database
await user.findByIdAndDelete(userId);
//now delete all the submissions of that user
await submission.deleteMany({userId});

res.status(200).json({message:"Profile deleted successfully"});
  }catch(err){
     res.status(500).json({message:"Failed to delete profile",error:err.message});
  }
}
module.exports = { register, login, logout, getProfile,adminRegister,deleteProfile};