
const problemRouter = require('./routes/problemRoutes');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const cookieparser = require('cookie-parser');
const redisClient = require('./config/redis');
const authRouter = require('./routes/authRoutes');
const codeSubmitRouter = require('./routes/submissionRoutes');
const chatRouter = require('./routes/chatRoute');
const videoRouter = require('./routes/videoCreator');
const paymentRouter = require('./routes/paymentRouter');
const planRouter = require('./routes/planRoutes');

const app = express();
app.use(express.json());
// app.js
app.use(cors({
    origin: [
        process.env.FRONTEND_URL,
          'https://code-prep-beryl.vercel.app',// Deployed frontend (e.g., https://codeprep.onrender.com)
        'http://localhost:5173'   // Local development
    ],
    credentials: true, // Required for cookies and auth
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(cookieparser());
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', codeSubmitRouter);
app.use('/chat', chatRouter);
app.use("/video", videoRouter);
app.use("/payment", paymentRouter);
app.use("/plan", planRouter);
app.use("/discussion", require('./routes/discussionRoutes'));
app.get('/', (req, res) => {
    res.status(200).json({ status: 'alive', message: 'CodePrep API is running!' });
});


module.exports = app;
