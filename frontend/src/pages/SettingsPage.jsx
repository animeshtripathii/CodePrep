import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuthStatus, logoutUser } from '../app/features/auth/authSlice';
import axiosClient from '../utils/axiosClient';
import { toast } from 'react-hot-toast';

const SettingsPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    password: '',
    profileImage: '',
  });

  const [imagePreview, setImagePreview] = useState(user?.profileImage || '');

  const [emailFlow, setEmailFlow] = useState({
    newEmail: '',
    otp: '',
    otpSent: false,
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      };
      if (profileData.password.trim()) payload.password = profileData.password;
      if (profileData.profileImage) payload.profileImage = profileData.profileImage;

      const res = await axiosClient.patch('/user/updateProfile', payload);
      toast.success(res?.data?.message || 'Profile updated');
      setProfileData((prev) => ({ ...prev, password: '', profileImage: '' }));
      dispatch(checkAuthStatus());
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = String(reader.result || '');
      setImagePreview(result);
      setProfileData((prev) => ({ ...prev, profileImage: result }));
    };
    reader.readAsDataURL(file);
  };

  const sendEmailOtp = async () => {
    if (!emailFlow.newEmail.trim()) {
      toast.error('Enter new email first');
      return;
    }
    setSendingOtp(true);
    try {
      const res = await axiosClient.post('/user/email-update/request-otp', {
        newEmail: emailFlow.newEmail.trim(),
      });
      toast.success(res?.data?.message || 'OTP sent');
      setEmailFlow((prev) => ({ ...prev, otpSent: true }));
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    if (!emailFlow.otp.trim()) {
      toast.error('Enter OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const res = await axiosClient.post('/user/email-update/verify-otp', {
        newEmail: emailFlow.newEmail.trim(),
        otp: emailFlow.otp.trim(),
      });
      toast.success(res?.data?.message || 'Email updated');
      setEmailFlow({ newEmail: '', otp: '', otpSent: false });
      dispatch(checkAuthStatus());
    } catch (error) {
      toast.error(error?.response?.data?.message || 'OTP verification failed');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your account? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await axiosClient.delete('/user/deleteProfile');
      localStorage.removeItem('codeprep_auth_token');
      await dispatch(logoutUser());
      toast.success('Account deleted successfully');
      navigate('/signup', { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete account');
    }
  };

  const initials = user?.firstName
    ? user.firstName.slice(0, 2).toUpperCase()
    : 'GU';

  return (
    <div className="min-h-[calc(100vh-61px)] text-slate-100 p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-10%] w-152 h-152 rounded-full bg-[#0EA5E9]/15 blur-[130px]" />
        <div className="absolute bottom-[-18%] right-[-10%] w-136 h-136 rounded-full bg-[#6366F1]/18 blur-[130px]" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border border-white/10 bg-[#0a0f1d]/45 p-6 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-slate-400 text-sm">Manage your account details and security.</p>
        </div>

        <form onSubmit={handleProfileUpdate} className="rounded-2xl border border-white/10 bg-[#0a0f1d]/45 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-indigo-300">Profile Details</h2>

          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full border border-indigo-300/40 overflow-hidden bg-indigo-500/20 flex items-center justify-center text-white font-bold text-sm">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors">
              <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
              Update Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <input
              name="firstName"
              value={profileData.firstName}
              onChange={handleProfileChange}
              placeholder="First name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <input
              name="lastName"
              value={profileData.lastName}
              onChange={handleProfileChange}
              placeholder="Last name"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <input
            name="password"
            type="password"
            value={profileData.password}
            onChange={handleProfileChange}
            placeholder="New password (optional)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={savingProfile}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 rounded-xl px-5 py-2.5 font-semibold"
          >
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>

        <div className="rounded-2xl border border-white/10 bg-[#0a0f1d]/45 p-6 backdrop-blur-xl space-y-4">
          <h2 className="text-lg font-semibold text-indigo-300">Update Email (OTP Verification)</h2>
          <input
            value={emailFlow.newEmail}
            onChange={(e) => setEmailFlow((prev) => ({ ...prev, newEmail: e.target.value }))}
            placeholder="Enter new email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendEmailOtp}
              disabled={sendingOtp}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 rounded-xl px-5 py-2.5 font-semibold"
            >
              {sendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>

          {emailFlow.otpSent && (
            <div className="space-y-3">
              <input
                value={emailFlow.otp}
                onChange={(e) => setEmailFlow((prev) => ({ ...prev, otp: e.target.value }))}
                placeholder="Enter OTP"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={verifyEmailOtp}
                disabled={verifyingOtp}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 rounded-xl px-5 py-2.5 font-semibold"
              >
                {verifyingOtp ? 'Verifying...' : 'Verify OTP & Update Email'}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-rose-300 mb-2">Security</h2>
          <button
            type="button"
            onClick={handleDeleteAccount}
            className="bg-rose-600 hover:bg-rose-500 rounded-xl px-5 py-2.5 font-semibold"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
