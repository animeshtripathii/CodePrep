import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axiosClient from '../utils/axiosClient';

const ContactUsPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.subject || !formData.message) {
            toast.error("Please fill in all fields.");
            return;
        }

        try {
            setIsSubmitting(true);
            const response = await axiosClient.post('/contact/submit', formData);
            if (response.data.success) {
                toast.success("Your message has been sent successfully!");
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error(response.data.message || "Failed to send message.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "An error occurred while sending your message.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen text-slate-200 font-[Manrope] relative overflow-x-hidden flex flex-col justify-center py-6 md:py-8 px-4 items-center bg-[radial-gradient(120%_120%_at_0%_0%,rgba(14,165,233,0.16)_0%,rgba(14,165,233,0)_48%),radial-gradient(120%_120%_at_100%_100%,rgba(99,102,241,0.20)_0%,rgba(99,102,241,0)_50%),#02040a]">
            
            {/* Ambient Background Glow */}
            <div className="absolute top-[-12%] left-[-8%] w-140 h-140 bg-[#0EA5E9]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-12%] right-[-8%] w-130 h-130 bg-[#6366F1]/12 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-160 z-10 animate-[slideUp_0.5s_ease-out_both]">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-400 hover:text-[#6366F1] transition-colors mb-5 group"
                >
                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    <span className="text-sm font-medium">Back</span>
                </button>

                <div className="bg-[#0a0f1d]/55 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
                    {/* Inner highlight */}
                    <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-[#6366F1]/60 to-transparent" />
                    
                    <div className="text-center mb-7">
                        <div className="w-16 h-16 rounded-full bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-3xl text-[#6366F1]">mail</span>
                        </div>
                        <h1 className="text-3xl font-display font-bold text-white mb-3 tracking-tight">Contact Us</h1>
                        <p className="text-slate-400 text-sm">Have feedback, suggestions, or need help? We'd love to hear from you.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Your Name</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">person</span>
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        className="w-full bg-[#050914]/65 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] block pl-10 p-3 transition-colors outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Email Address</label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">alternate_email</span>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        className="w-full bg-[#050914]/65 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] block pl-10 p-3 transition-colors outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Subject</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-[20px]">subject</span>
                                <input 
                                    type="text" 
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    placeholder="How can we help you?"
                                    className="w-full bg-[#050914]/65 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] block pl-10 p-3 transition-colors outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300">Message</label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-4 text-slate-500 text-[20px]">edit_note</span>
                                <textarea 
                                    name="message"
                                    rows="4"
                                    value={formData.message}
                                    onChange={handleChange}
                                    placeholder="Write your suggestions or questions here..."
                                    className="w-full bg-[#050914]/65 border border-white/10 text-slate-200 text-sm rounded-lg focus:ring-1 focus:ring-[#6366F1] focus:border-[#6366F1] block pl-10 p-3 transition-colors outline-none resize-none"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#5458de] text-white font-bold py-3.5 px-6 rounded-lg shadow-[0_0_18px_rgba(99,102,241,0.28)] hover:shadow-[0_0_28px_rgba(99,102,241,0.42)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span>Send Message</span>
                                    <span className="material-symbols-outlined text-[20px]">send</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ContactUsPage;
