const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'problem',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    tabSwitchCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'flagged'],
        default: 'active'
    }
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
