const mongoose=require('mongoose');
async function connectDB(){
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            dbName: 'CodeBench'
        });
        // Connection options can be added here if needed
    }catch(err){
        console.error("MongoDB connection failed:",err.message);
    }
}

module.exports = connectDB;