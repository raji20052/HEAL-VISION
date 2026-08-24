import React, { useState, useEffect } from 'react';
import { X, Share2, Stethoscope, Check, ShieldCheck, AlertCircle, Copy } from 'lucide-react';
import { api } from '../../services/api';
import { WoundDetail } from '../../types';

interface ShareDoctorModalProps {
  wound: WoundDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShareDoctorModal: React.FC<ShareDoctorModalProps> = ({
  wound,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [doctorsList, setDoctorsList] = useState<any[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorEmail, setDoctorEmail] = useState<string>('');
  const [permissions, setPermissions] = useState<string>('can_comment');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.sharing.listDoctors().then(docs => {
        setDoctorsList(docs);
        if (docs.length > 0) {
          setSelectedDoctorId(docs[0].id);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.sharing.share({
        wound_id: wound.id,
        doctor_id: selectedDoctorId || undefined,
        doctor_email: doctorEmail || undefined,
        permissions,
        expires_in_days: expiresInDays
      });
      setShareSuccess(res.share_token);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to share wound record.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/doctor/review/${wound.id}?token=${shareSuccess}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Share2 size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Share with Healthcare Provider</h2>
          </div>
          <p className="text-xs text-slate-500">
            Grant your physician secure remote access to review wound photos, AI measurements, and leave recommendations.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {shareSuccess ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span>Physician Access Granted</span>
              </div>
              <p className="text-emerald-700">
                Your wound history and AI monitoring trajectory have been securely shared. Your doctor can now access the clinical dashboard to review your progress.
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500 block">Direct Telemedicine Access Token:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareSuccess}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-700 flex-1 select-all"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleShare} className="space-y-4 text-xs">
            
            {/* Choose from Doctor Directory */}
            {doctorsList.length > 0 && (
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Select Registered Physician
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {doctorsList.map(doc => (
                    <label
                      key={doc.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedDoctorId === doc.id
                          ? 'border-teal-500 bg-teal-50/50 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="doctor"
                        value={doc.id}
                        checked={selectedDoctorId === doc.id}
                        onChange={() => {
                          setSelectedDoctorId(doc.id);
                          setDoctorEmail('');
                        }}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-slate-800 text-xs">{doc.name}</div>
                        <div className="text-[11px] text-slate-500">{doc.specialty} • {doc.hospital}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Doctor Email alternative */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Or Share via Doctor Email
              </label>
              <input
                type="email"
                value={doctorEmail}
                onChange={(e) => {
                  setDoctorEmail(e.target.value);
                  setSelectedDoctorId('');
                }}
                placeholder="physician@hospital.org"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-teal-500"
              />
            </div>

            {/* Permissions & Expiration */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Permissions
                </label>
                <select
                  value={permissions}
                  onChange={(e) => setPermissions(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                >
                  <option value="can_comment">Can Add Clinical Notes</option>
                  <option value="read_only">Read-Only Access</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Access Duration
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium"
                >
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={365}>1 Year</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (!selectedDoctorId && !doctorEmail)}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? 'Authorizing...' : 'Grant Access'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
