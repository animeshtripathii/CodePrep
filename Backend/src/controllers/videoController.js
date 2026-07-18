const { generateSignature, saveVideo, deletedVideo } = require('../services/videoService');
const generateUploadSignature = async (req, res) => {
    try {
        const { problemId, userId } = req.query;
        if (!problemId || !userId) {
            return res.status(400).json({ error: 'Problem ID and User ID are required' });
        }
        const result = await generateSignature(problemId, userId);
        res.json({
            signature: result.signature,
            timestamp: result.timestamp,
            publicId: result.publicId,
            apiKey: process.env.CLOUDINARY_API_KEY,
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload`
        });
    } catch (err) {
        console.error("Error generating upload signature:", err.message);
        res.status(500).json({ error: 'Failed to generate upload signature' });
    }
};
const saveVideoMetadata = async (req, res) => {
    try {

        const userId = req.result._id;
        const { problemId, cloudinaryPublicId, secureUrl, duration } = req.body;
        //verify the upload in Cloudinary
        const result = await saveVideo(userId, problemId, cloudinaryPublicId, secureUrl, duration);
        res.json({
            message: 'Video metadata saved successfully', videoSolution: {
                id: result._id,
                thumbnailUrl: result.thumbnailUrl,
                duration: result.duration,
                uploadAt: result.createdAt
            }
        });
    } catch (err) {
        console.error("Error saving video metadata:", err.message);
        res.status(500).json({ error: 'Failed to save video metadata' });
    }
}

const deleteVideo = async (req, res) => {
    try {
        const problemId = req.params.problemId;
        const deleted = await deletedVideo(problemId);
        if (deleted) {
            res.json({ message: 'Video deleted successfully' });
        } else {
            res.status(404).json({ error: 'Failed to delete video' });
        }
    } catch (err) {
        console.error("Error deleting video:", err.message);
        res.status(500).json({ error: 'Failed to delete video' });
    }
}
module.exports = { generateUploadSignature, saveVideoMetadata, deleteVideo }