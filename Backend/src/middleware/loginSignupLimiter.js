const rateLimit = require('express-rate-limit');
const loginSignupLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 4,
  message: 'Too many requests, please try again after 5 minutes.'
});

module.exports = loginSignupLimiter;
