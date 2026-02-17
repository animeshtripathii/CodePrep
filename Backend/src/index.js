const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const cookieparser = require('cookie-parser');

// Config
const connectDB = require('./config/db');
const redisClient = require('./config/redis');

// Routes
const authRouter = require('./routes/auth.routes');
const problemRouter = require('./routes/problem.routes');
const codeSubmitRouter = require('./routes/codeSubmit.routes');

const app = express();
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));

app.use(express.json());
app.use(cookieparser());
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', codeSubmitRouter);

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
