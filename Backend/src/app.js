require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const hpp = require('hpp');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieparser = require('cookie-parser');

const authRouter = require('./routes/authRoutes');
const problemRouter = require('./routes/problemRoutes');
const codeSubmitRouter = require('./routes/submissionRoutes');
const chatRouter = require('./routes/chatRoute');
const videoRouter = require('./routes/videoCreator');
const paymentRouter = require('./routes/paymentRouter');
const planRouter = require('./routes/planRoutes');
const interviewRouter = require('./routes/interviewRoutes');
const agoraRouter = require('./routes/agoraRoutes');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const sanitizeNoSqlInput = (target) => {
    if (!target || typeof target !== 'object') return;

    if (Array.isArray(target)) {
        target.forEach(sanitizeNoSqlInput);
        return;
    }

    Object.keys(target).forEach((key) => {
        const value = target[key];
        if (key.startsWith('$') || key.includes('.')) {
            delete target[key];
            return;
        }
        sanitizeNoSqlInput(value);
    });
};

const configuredOrigins = [
    process.env.FRONTEND_URL,
].filter(Boolean);

const normalizeOrigin = (origin) => String(origin || '').trim().replace(/\/$/, '');
const configuredOriginSet = new Set(configuredOrigins.map(normalizeOrigin));

const isAllowedOrigin = (origin) => {
    if (!origin) return true;
    const normalizedOrigin = normalizeOrigin(origin);
    if (configuredOriginSet.has(normalizedOrigin)) return true;

    if (process.env.NODE_ENV !== 'production') {
        // In local development, allow any browser origin (LAN IPs, localhost, tunnels, mobile browsers).
        return true;
    }

    return false;
};

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 500 : 1500,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again shortly.'
});

app.use(cors({
    origin: function (origin, callback) {
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.error('Blocked CORS origin:', origin);
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

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(apiLimiter);

// Razorpay webhook needs raw request body for HMAC verification.
app.use('/payment/verify-payment', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieparser());
app.use(hpp());
app.use((req, res, next) => {
    sanitizeNoSqlInput(req.body);
    sanitizeNoSqlInput(req.params);
    sanitizeNoSqlInput(req.query);
    next();
});

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', codeSubmitRouter);
app.use('/chat', chatRouter);
app.use("/video", videoRouter);
app.use("/payment", paymentRouter);
app.use("/plan", planRouter);
app.use("/discussion", require('./routes/discussionRoutes'));
app.use("/interview", interviewRouter);
app.use("/agora", agoraRouter);

app.get('/', (req, res) => {
    res.status(200).json({ status: 'alive', message: 'CodePrep API is running!' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error('Unhandled API error:', err?.message || err);
    res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;