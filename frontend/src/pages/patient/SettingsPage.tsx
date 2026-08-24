import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Shield, Lock, CheckCircle2 } from 'lucide-react';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'privacy' | 'security'>('notifications');
  const [analysisResults, setAnalysisResults] = useState(true);
  const [doctorReviews, setDoctorReviews] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [alerts, setAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
            Settings
          </h2>
          <p className="text-xs text-slate-400">
            Customize your app experience
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Preferences saved successfully.</span>
        </div>
      )}

      {/* 2-Column Split: Tabs Navigation (Left) + Form (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Left Tabs (4 cols) */}
        <div className="md:col-span-4 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          {[
            { id: 'account', label: 'Account', icon: User },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'privacy', label: 'Privacy', icon: Shield },
            { id: 'security', label: 'Security', icon: Lock },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id as any)}
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

        {/* Right Content (8 cols) */}
        <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          
          <h3 className="font-extrabold text-sm text-slate-900 border-b border-slate-100 pb-3">
            Notification Preferences
          </h3>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            
            {/* Toggle 1: Image Analysis Results */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Image Analysis Results</span>
                <span className="text-[11px] text-slate-500">Notify when image is analyzed</span>
              </div>
              <button
                type="button"
                onClick={() => setAnalysisResults(!analysisResults)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  analysisResults ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Toggle 2: Doctor Reviews */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Doctor Reviews</span>
                <span className="text-[11px] text-slate-500">Get notified when a doctor reviews your wound</span>
              </div>
              <button
                type="button"
                onClick={() => setDoctorReviews(!doctorReviews)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  doctorReviews ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Toggle 3: Reminders */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Reminders</span>
                <span className="text-[11px] text-slate-500">Reminders to capture wound images</span>
              </div>
              <button
                type="button"
                onClick={() => setReminders(!reminders)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  reminders ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            {/* Toggle 4: Alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <span className="font-bold text-slate-900 block text-xs">Alerts</span>
                <span className="text-[11px] text-slate-500">Important monitoring alerts</span>
              </div>
              <button
                type="button"
                onClick={() => setAlerts(!alerts)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  alerts ? 'bg-teal-600 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="bg-white w-4 h-4 rounded-full shadow-md" />
              </button>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Save Preferences
              </button>
            </div>

          </form>

        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
