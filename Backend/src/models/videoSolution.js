const mongoose= require('mongoose');
const { Schema } = mongoose; 

const videoSolutionSchema = new Schema({
    problemId: {
        type: Schema.Types.ObjectId,
        ref: 'problem',
        required: true,
        unique: true,
        select:true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        select:true
    },
    cloudinaryPublicId: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
        secureUrl: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailUrl: {
        type: String,
    },
    duration: {
        type: Number,
    }
}, { timestamps: true });

const VideoSolution = mongoose.model('videoSolution', videoSolutionSchema);

module.exports = VideoSolution;