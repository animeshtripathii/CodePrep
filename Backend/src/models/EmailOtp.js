const mongoose = require('mongoose');

const emailOtpSchema = new mongoose.Schema(
    {
        emailId: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        purpose: {
            type: String,
            enum: ['signup', 'email_update'],
            required: true,
            index: true,
        },
        otpHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            default: null,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailOtpSchema.index({ emailId: 1, purpose: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('EmailOtp', emailOtpSchema);
