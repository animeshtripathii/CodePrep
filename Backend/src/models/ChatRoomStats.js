const mongoose = require('mongoose');

const chatRoomStatsSchema = new mongoose.Schema({
    baseRoomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    activeSubRooms: [{
        subRoomId: { type: String, required: true },
        activeCount: { type: Number, default: 0 }
    }]
}, { timestamps: true });

module.exports = mongoose.model('ChatRoomStats', chatRoomStatsSchema);
