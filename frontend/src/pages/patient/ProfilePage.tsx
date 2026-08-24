import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Lock, Sliders, Trash2, Camera, 
  CheckCircle2, AlertCircle, Save 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences' | 'delete'>('profile');
  
  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('1998-05-15');
  
  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state from current authenticated user
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.patient_profile?.gender) {
        setGender(user.patient_profile.gender);
      }
      if (user.patient_profile?.date_of_birth) {
        setDateOfBirth(user.patient_profile.date_of_birth);
      }
    }
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const updatedUser = await api.auth.updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || undefined,
        gender: gender,
        date_of_birth: dateOfBirth || undefined
      });

      updateUser(updatedUser);
      setSuccessMessage('Your profile changes have been saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to save profile changes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.auth.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccessMessage('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Profile
          </h2>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Split: Tabs Navigation (Left) + Form (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Tabs (4 cols) */}
        <div className="md:col-span-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          {[
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'password', label: 'Change Password', icon: Lock },
            { id: 'preferences', label: 'Preferences', icon: Sliders },
            { id: 'delete', label: 'Delete Account', icon: Trash2 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id as any);
                  setSuccessMessage(null);
                  setErrorMessage(null);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-teal-600' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Form Content (8 cols) */}
        <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          
          {/* TAB 1: Profile Information */}
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Profile Information
                </h3>

                {/* Dynamic Avatar with user's initial */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white font-black text-xl flex items-center justify-center shadow-xs uppercase">
                    {fullName ? fullName.charAt(0) : 'U'}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-1 -right-1 p-1 bg-slate-900 text-white rounded-full hover:bg-teal-600 transition-colors shadow-xs"
                    title="Change Avatar"
                  >
                    <Camera size={11} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                  />
                  <span className="text-[10px] text-slate-400">Account login identifier</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">Date of Birth</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700 text-[11px]">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +1 234 567 8900"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                  >
                    <Save size={14} />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: Change Password */}
          {activeTab === 'password' && (
            <div className="space-y-5">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Change Password
              </h3>

              <form onSubmit={handlePasswordChange} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Create a new password (min 6 characters)"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 text-[11px]">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your new password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
                  >
                    <Lock size={14} />
                    <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-5">
              <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
                Account Preferences
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">Measurement Units</span>
                    <span className="text-[11px] text-slate-500">Metric standard area in cm² and millimetres</span>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">Metric (cm²)</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">AI Computer Vision Confidence Filter</span>
                    <span className="text-[11px] text-slate-500">Highlight wound boundary overlays automatically</span>
                  </div>
                  <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">Enabled</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Delete Account */}
          {activeTab === 'delete' && (
            <div className="space-y-5">
              <h3 className="font-extrabold text-sm text-rose-600 border-b border-slate-100 pb-3">
                Delete Account
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Permanently deletes your account profile, wound monitoring dossiers, and uploaded clinical photographs. This action cannot be undone.
              </p>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to sign out and clear your active session?')) {
                    logout();
                    navigate('/login');
                  }
                }}
                className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Trash2 size={14} />
                <span>Delete Account & Sign Out</span>
              </button>
            </div>
          )}

        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
