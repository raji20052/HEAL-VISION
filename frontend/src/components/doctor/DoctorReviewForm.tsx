import React, { useState } from 'react';
import { Stethoscope, Send, CheckCircle2, Calendar, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

interface DoctorReviewFormProps {
  woundId: string;
  woundImageId?: string;
  onSuccess: () => void;
}

export const DoctorReviewForm: React.FC<DoctorReviewFormProps> = ({
  woundId,
  woundImageId,
  onSuccess
}) => {
  const [observation, setObservation] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'reviewed' | 'follow_up_required' | 'urgent_consult'>('reviewed');
  const [followUpDate, setFollowUpDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observation.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await api.doctor.addClinicalNote({
        wound_id: woundId,
        wound_image_id: woundImageId,
        clinical_observation: observation,
        recommendations: recommendations || undefined,
        follow_up_date: followUpDate || undefined,
        review_status: reviewStatus
      });
      setSuccess(true);
      setObservation('');
      setRecommendations('');
      onSuccess();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record clinical review note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Stethoscope size={18} className="text-teal-600" />
          <h3 className="font-extrabold text-sm text-slate-900">Record Physician Clinical Note</h3>
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-0.5 rounded-md">
          Doctor-Entered Record
        </span>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Clinical observation successfully recorded and shared with patient.</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Clinical Observation & Visual Assessment *
          </label>
          <textarea
            required
            rows={3}
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            placeholder="e.g., Incision margins well-approximated through transparent dressing. Advancing pink epithelial tissue noted. No excessive periwound erythema."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Patient Guidance / Recommendations (Optional)
          </label>
          <textarea
            rows={2}
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            placeholder="e.g., Continue keeping area dry. Maintain current biopolymer dressing intact. Capture follow-up photograph in 4 days."
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Review Status
            </label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
            >
              <option value="reviewed">Routine Review (Stable)</option>
              <option value="follow_up_required">Follow-Up Required</option>
              <option value="urgent_consult">Urgent In-Person Consult</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Scheduled Follow-Up Date
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !observation.trim()}
          className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
        >
          <Send size={14} />
          <span>{loading ? 'Submitting Review...' : 'Save Clinical Review Note'}</span>
        </button>

      </form>

    </div>
  );
};
