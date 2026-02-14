const mongoose = require('mongoose'); 
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 3,
        maxLength: 30,
        trim: true
    },
    lastName: {
        type: String,
        minLength: 3,
        maxLength: 30,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    age: {
        type: Number,
        min: 13,
        max: 80,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    problemSolved: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'problem'
        }],
        default: []
    },
    password: {
        type: String,
        required: true
    }
}, { timestamps: true });

const User = mongoose.model('user', userSchema);

module.exports = User;