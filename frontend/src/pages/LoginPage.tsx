import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter your email address or mobile number and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(identifier, password);
      navigate(role === 'doctor' ? '/doctor/dashboard' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect email/mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-teal-500 selection:text-white font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/90 p-8 shadow-sm space-y-6">
        
        {/* Top Brand & Title */}
        <div className="text-center space-y-2">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center mx-auto shadow-xs">
            <Activity size={20} />
          </div>
          <span className="font-extrabold text-sm text-slate-800 tracking-tight block">
            Smart Wound <span className="text-teal-600 font-semibold">Healing Monitor</span>
          </span>
          <div className="pt-2">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-xs text-slate-400">Login to your account</p>
          </div>
        </div>

        {/* Role Pill Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'patient'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient
          </button>
          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`py-2 text-xs font-bold rounded-lg transition-all ${
              role === 'doctor'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctor
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="block font-bold text-slate-700 text-[11px]">
              Email address or Mobile number
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or mobile number"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 text-[11px]">
                Password
              </label>
              <Link to="/forgot-password" className="text-teal-600 hover:underline text-[11px] font-semibold">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

        </form>

        {/* Bottom Link */}
        <div className="pt-2 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-teal-600 font-bold hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};
