const Problem = require('../models/problem');
const cloudinary = require('../utils/cloudinary');
const VideoSolution = require('../models/videoSolution');
const generateSignature = async (problemId, userId) => {
    try {
        //verify problem exists
        const problem = await Problem.findById(problemId);
        if (!problem) {
            throw new Error("Problem not found");
        }

        //generate signature
        const timestamp = Math.round(new Date().getTime() / 1000);
        const publicId = `codePrep-solution/${problemId}/${userId}_${timestamp}`;
        // In a real implementation, you would use a secure method to generate the signature, such as HMAC with a secret key.

        //upload parameters
        const uploadParams = {
            public_id: publicId,
            folder: 'codePrep-solutions',
            timestamp: timestamp
        };

        const signature = cloudinary.utils.api_sign_request(uploadParams, process.env.CLOUDINARY_API_SECRET);
        return { signature, timestamp, publicId };
    } catch (error) {
        console.error("Error in generateSignature:", error.message);
        throw new Error("Failed to generate signature");
    }
};

const saveVideo = async (userId, problemId, cloudinaryPublicId, secureUrl, duration) => {
    try {
        const cloudinaryResources = await cloudinary.api.resource(cloudinaryPublicId, { resource_type: 'video' });
        if (!cloudinaryResources) {
            throw new Error('Video not found in Cloudinary');
        }
        //check if the video is already associated with the problem
        const existingVideo = await VideoSolution.findOne({ problemId, userId, cloudinaryPublicId });
        if (existingVideo) {
            throw new Error('A video solution for this problem already exists');
        }
        const thumbnailUrl = cloudinary.url(cloudinaryResources.public_id, {
            resource_type: 'image',
            transformation: [
                { width: 400, height: 225, crop: 'fill' },
                { quality: 'auto' },
                { start_offset: 'auto' }
            ],
            format: 'jpg'
        })
        const videoSolution = new VideoSolution({
            problemId,
            userId,
            cloudinaryPublicId,
            duration: cloudinaryResources.duration || duration,
            secureUrl,
            thumbnailUrl: thumbnailUrl
        });
        await videoSolution.save();
        return videoSolution;
    }
    catch (error) {
        console.error("Error in saveVideo:", error.message);
        throw new Error("Failed to save video metadata");
    }
}
const deletedVideo = async (problemId) => {
    try {
        const video = await VideoSolution.findOneAndDelete({ problemId: problemId });
        if (!video) {
            throw new Error('Video not found');
        }
        await cloudinary.uploader.destroy(video.cloudinaryPublicId, { resource_type: 'video', invalidate: true });
        return true;
    } catch (error) {
        console.error("Error in deleteVideo:", error.message);
        throw new Error("Failed to delete video");
    }
}
module.exports = { generateSignature, saveVideo, deletedVideo };