import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        <div className="text-center space-y-2">
          <Link to="/landing" className="inline-flex items-center gap-2">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Activity size={24} />
            </div>
          </Link>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Reset Your Password
          </h2>
          <p className="text-xs text-slate-500">
            Enter your email to receive a password reset link
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          {submitted ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-sm text-slate-800">Reset Email Sent</h3>
              <p className="text-xs text-slate-500">
                If an account exists for <strong>{email}</strong>, we have sent instructions to reset your password.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
                >
                  <ArrowLeft size={14} />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-teal-500/25 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight size={15} />
              </button>

              <div className="pt-2 text-center">
                <Link to="/login" className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1">
                  <ArrowLeft size={13} />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
