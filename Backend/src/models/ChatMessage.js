const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index: true
    },
    roomId: {
        type: String,
        required: true,
        index: true // Extremely important for fast cursor pagination on a specific room
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: -1 // Indexed descending for efficient history fetching
    }
});

// Compound index for querying a specific room's messages ordered by time
chatMessageSchema.index({ roomId: 1, _id: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
