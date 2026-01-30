const mongoose=require('mongoose');
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI);
        // Connection options can be added here if needed
        console.log("MongoDB connected successfully");
    }catch(err){
        console.error("MongoDB connection failed:",err.message);
    }
}

module.exports = connectDB;