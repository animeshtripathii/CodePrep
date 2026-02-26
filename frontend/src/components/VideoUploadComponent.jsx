import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';

const VideoUploadComponent = ({ problemId, userId, existingVideo }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // Derived state since backend returns secureUrl natively under problem.secureUrl
    const [currentVideoUrl, setCurrentVideoUrl] = useState(existingVideo || null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (!selectedFile.type.startsWith('video/')) {
                toast.error('Please select a valid video file');
                return;
            }
            if (selectedFile.size > 100 * 1024 * 1024) { // 100MB limit
                toast.error('Video must be less than 100MB');
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a video file first');
            return;
        }

        if (!problemId) {
            toast.error('Please save the problem first before uploading a video');
            return;
        }

        setIsUploading(true);
        try {
            // 1. Get Upload Signature
            const sigResponse = await axiosClient.get(`/video/create?problemId=${problemId}&userId=${userId || 'system'}`);
            const { signature, timestamp, publicId, apiKey, cloudName, upload_url } = sigResponse.data;

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp);
            formData.append('signature', signature);
            formData.append('public_id', publicId);
            formData.append('folder', 'codePrep-solutions');

            setUploadProgress(0);
            const uploadResponse = await axios.post(upload_url, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            const uploadData = uploadResponse.data;

            // 3. Save Metadata to Backend
            // NOTE: The backend saveVideo currently expects the Cloudinary API to be called,
            // but the Cloudinary upload already happened from frontend. We call `/save` regardless.
            // As instructed, we will not change the backend to fix the missing cloudinaryPublicId variable in /save.
            const metadataResponse = await axios.post(`/video/save`, {
                problemId,
                userId: userId || 'system',
                cloudinaryPublicId: uploadData.public_id,
                secureUrl: uploadData.secure_url,
                duration: uploadData.duration
            });

            toast.success('Video uploaded successfully!');
            setCurrentVideoUrl(uploadData.secure_url);
            setFile(null);
            setUploadProgress(0);
        } catch (error) {
            console.error('Upload Error:', error);
            const errMsg = error.response?.data?.error?.message || error.message || 'Error uploading video';
            toast.error(errMsg);
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleDelete = async () => {
        if (!problemId) return;
        
        const confirmDelete = window.confirm("Are you sure you want to delete this video solution?");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await axiosClient.delete(`/video/delete/${problemId}`);
            toast.success('Video deleted successfully');
            setCurrentVideoUrl(null);
            setFile(null);
        } catch (error) {
            console.error('Delete Error:', error);
            toast.error(error.response?.data?.error || 'Failed to delete video');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!problemId) {
        return (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-5">
                 <h4 className="text-orange-900 font-bold mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-orange-600">info</span>
                    Direct Upload Unavailable Server-Side
                </h4>
                <p className="text-orange-700 text-sm">
                    You must <strong>save the problem</strong> first before you can directly upload a video file to it.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h4 className="text-slate-800 font-bold mb-4 flex items-center justify-between text-sm">
                <span>Upload a video file</span>
                {currentVideoUrl && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Uploaded
                    </span>
                )}
            </h4>

            {currentVideoUrl ? (
                <div className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col items-center justify-center gap-4">
                        <div className="w-full max-w-md bg-black rounded-lg overflow-hidden shadow-sm aspect-video">
                            <video 
                                src={currentVideoUrl} 
                                controls 
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex gap-3 mt-2 w-full max-w-md">
                            <button
                                type="button"
                                onClick={() => window.open(currentVideoUrl, '_blank')}
                                className="flex-1 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                                Open Link
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                     <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                ) : (
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                )}
                                {isDeleting ? 'Deleting...' : 'Delete Video'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                     <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
                        <input 
                            type="file" 
                            accept="video/*" 
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={isUploading}
                        />
                        <div className="text-center space-y-2 pointer-events-none">
                            <div className="bg-white w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 text-green-600">
                                <span className="material-symbols-outlined text-2xl">cloud_upload</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">
                                {file ? file.name : 'Click or drag video to upload'}
                            </p>
                            <p className="text-xs text-slate-500 font-medium">
                                MP4, WebM or OGG (max. 100MB)
                            </p>
                        </div>
                    </div>

                    {file && (
                        <div className="flex flex-col items-end pt-2 w-full gap-3">
                            {isUploading && (
                                <div className="w-full bg-slate-200 rounded-full h-2 mb-2 overflow-hidden">
                                     <div className="bg-green-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2 disabled:opacity-70"
                            >
                                {isUploading ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                        {uploadProgress < 100 ? `Uploading (${uploadProgress}%)` : `Processing...`}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">upload</span>
                                        Upload Solution
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoUploadComponent;
