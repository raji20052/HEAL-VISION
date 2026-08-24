import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Activity, Sparkles, TrendingUp, Users, 
  ShieldCheck, ArrowRight, Camera, CheckCircle2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemo = async (role: 'patient' | 'doctor') => {
    try {
      await demoLogin(role);
      navigate(role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
      
      {/* Top Navigation Bar */}
      <header className="h-18 border-b border-slate-100 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity size={18} />
          </div>
          <span className="font-extrabold text-base text-slate-900 tracking-tight">
            Smart Wound
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-8 text-xs font-semibold text-slate-600">
          <a href="#home" className="hover:text-teal-600 transition-colors">Home</a>
          <a href="#how-it-works" className="hover:text-teal-600 transition-colors">How It Works</a>
          <a href="#for-patients" className="hover:text-teal-600 transition-colors">For Patients</a>
          <a href="#for-doctors" className="hover:text-teal-600 transition-colors">For Doctors</a>
          <a href="#technology" className="hover:text-teal-600 transition-colors">Technology</a>
          <a href="#about" className="hover:text-teal-600 transition-colors">About</a>
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDemo('patient')}
            className="px-4 py-2 text-teal-700 bg-white border border-teal-600 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all shadow-xs"
          >
            Patient Login
          </button>
          <button
            onClick={() => handleDemo('doctor')}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Doctor Login
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl mx-auto px-6 sm:px-12 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Hero Content */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-teal-800 tracking-tight leading-[1.1]">
            Smart Wound<br />
            <span className="text-teal-700">Healing Monitor</span>
          </h1>

          <p className="text-lg font-bold text-slate-700 leading-snug">
            AI-assisted wound monitoring without unnecessary dressing removal.
          </p>

          <p className="text-sm text-slate-500 max-w-xl leading-relaxed">
            Track wound image changes over time using computer vision and support remote monitoring with your healthcare professional.
          </p>

          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              onClick={() => handleDemo('patient')}
              className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-500/20"
            >
              Start Monitoring
            </button>
            <a
              href="#how-it-works"
              className="px-6 py-3 bg-white text-slate-700 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all shadow-xs"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Right Hero Graphic: Clinician & Mobile Mockup */}
        <div className="lg:col-span-5 flex items-center justify-center relative">
          <div className="w-full max-w-md bg-gradient-to-br from-teal-50 via-cyan-50 to-white rounded-3xl p-6 border border-teal-100 shadow-xl relative overflow-hidden flex items-center justify-center min-h-[380px]">
            
            {/* Ambient Background Circles */}
            <div className="absolute top-4 right-4 w-32 h-32 rounded-full bg-teal-200/40 blur-2xl pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-40 h-40 rounded-full bg-cyan-200/40 blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center gap-4">
              
              {/* Doctor Silhouette / Avatar Card */}
              <div className="w-28 p-3 bg-white rounded-2xl border border-slate-200/80 shadow-md text-center space-y-2 shrink-0">
                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto">
                  <Activity size={24} />
                </div>
                <div className="text-[11px] font-extrabold text-slate-800 leading-tight">
                  Dr. Robert
                </div>
                <span className="text-[9px] text-teal-600 font-semibold block uppercase">
                  Clinician
                </span>
              </div>

              {/* Mobile Phone Mockup */}
              <div className="w-52 bg-slate-900 rounded-3xl p-2.5 shadow-2xl border-4 border-slate-800 text-white space-y-2">
                <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />
                
                {/* Viewfinder Screen */}
                <div className="bg-slate-950 rounded-2xl p-2 space-y-2">
                  <div className="relative aspect-square rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center border border-teal-500/40">
                    <img
                      src="/storage/images/sample_wound_day1.jpg"
                      alt="Wound View"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80';
                      }}
                    />
                    {/* Viewfinder Reticle */}
                    <div className="absolute inset-2 rounded-lg border-2 border-teal-400 border-dashed flex items-center justify-center">
                      <span className="text-[8px] bg-slate-900/80 text-teal-200 px-1.5 py-0.5 rounded font-mono">
                        SCANNING
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-300 font-medium px-1">
                    <span>Status: <strong className="text-emerald-400">Improving</strong></span>
                    <span>82%</span>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </section>

      {/* 4 Feature Columns Strip */}
      <section className="bg-slate-50 border-t border-slate-200/80 py-10 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Sparkles size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">AI-Powered Analysis</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Computer vision analyzes wound healing progress through transparent dressings.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <TrendingUp size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Track Progress</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visualize healing with charts, multi-layer contours, and longitudinal timeline.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Doctor Collaboration</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Share and consult with your healthcare provider remotely via secure telemedicine.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Secure & Private</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your data is encrypted and always protected under role-based patient consent.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        Computer Vision-Based Assessment of Biopolymer Wound Dressings for Infection and Healing Monitoring.
      </footer>

    </div>
  );
};
