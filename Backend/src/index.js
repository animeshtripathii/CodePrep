const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const redisClient = require('./config/redis');
const authRouter = require('./routes/userAuth');

const app = express();

app.use(express.json());
app.use(cookieparser());
app.use('/user', authRouter);

const InitializeServer = async () => {
  try {
       await connectDB();
       await redisClient.connect();
       console.log("Connected to Redis successfully");
       console.log("Connected to MongoDB successfully");
       const PORT = process.env.PORT;
        app.listen(PORT, () => {
          console.log(`Server is running on port ${PORT}`);
        });
  } catch (err) {
    console.error("Server Initialization Error:", err.message);
  }
};

InitializeServer();
