const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const problemRouter = require('./routes/problemRoutes');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const redisClient = require('./config/redis');
const authRouter = require('./routes/authRoutes');
const codeSubmitRouter = require('./routes/submissionRoutes');
const chatRouter = require('./routes/chatRoute');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', // Update with your frontend URL
  credentials: true, // Allow cookies to be sent
}));

app.use(express.json());
app.use(cookieparser());
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', codeSubmitRouter);
app.use('/chat', chatRouter);

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
