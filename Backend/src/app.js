require('dotenv').config();
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

const allowedOrigins = [
    process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/$/, '') : null,
    'http://localhost:5173',
    'https://code-prep-beryl.vercel.app'
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS: ' + origin));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
console.log(process.env.FRONTEND_URL);
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
