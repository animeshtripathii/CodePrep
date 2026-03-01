require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieparser = require('cookie-parser');

const authRouter = require('./routes/authRoutes');
const problemRouter = require('./routes/problemRoutes');
const codeSubmitRouter = require('./routes/submissionRoutes');
const chatRouter = require('./routes/chatRoute');
const videoRouter = require('./routes/videoCreator');
const paymentRouter = require('./routes/paymentRouter');
const planRouter = require('./routes/planRoutes');

const app = express();

const allowedOrigins = [
    'https://code-prep-beryl.vercel.app',
    'http://localhost:5173'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Cache-Control',
        'Pragma',
        'Expires',
        'X-Requested-With'
    ],
    exposedHeaders: ['set-cookie']
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