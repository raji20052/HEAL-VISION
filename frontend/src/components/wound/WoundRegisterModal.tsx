import React, { useState } from 'react';
import { X, Plus, AlertCircle, Sparkles, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { WoundDetail } from '../../types';

interface WoundRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newWound: WoundDetail) => void;
}

export const WoundRegisterModal: React.FC<WoundRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [woundType, setWoundType] = useState('surgical');
  const [bodyLocation, setBodyLocation] = useState('Lower Abdomen');
  const [dressingType, setDressingType] = useState('Chitosan Biopolymer Transparent Film');
  const [firstObservedDate, setFirstObservedDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name or identifier for the wound.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await api.wounds.create({
        name,
        wound_type: woundType,
        body_location: bodyLocation,
        dressing_type: dressingType,
        first_observed_date: firstObservedDate,
        dressing_applied_date: firstObservedDate,
        status: 'active',
        description,
        notes
      });
      onSuccess(created);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to register wound record.');
    } finally {
      setLoading(false);
    }
  };

  const biopolymerOptions = [
    'Chitosan Biopolymer Transparent Film',
    'Chitosan-Gelatin Crosslinked Membrane',
    'Alginate-Hydrogel Biopolymer Sheet',
    'Collagen-Chitosan Matrix Film',
    'Polyurethane-Chitosan Transparent Dressing',
    'Nanocellulose Biopolymer Film',
    'Other Transparent Dressing'
  ];

  const woundTypes = [
    { value: 'surgical', label: 'Surgical Incision' },
    { value: 'ulcer', label: 'Venous / Pressure Ulcer' },
    { value: 'traumatic', label: 'Traumatic Laceration' },
    { value: 'burn', label: 'Thermal / Friction Burn' },
    { value: 'other', label: 'Other Wound Type' },
  ];

  const bodyLocations = [
    'Lower Abdomen',
    'Upper Abdomen / Chest',
    'Left Lower Leg / Ankle',
    'Right Lower Leg / Ankle',
    'Left Arm / Forearm',
    'Right Arm / Forearm',
    'Sacrum / Lower Back',
    'Foot / Heel',
    'Other Body Location'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Plus size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Register New Wound Profile</h2>
          </div>
          <p className="text-xs text-slate-500">
            Configure wound details and biopolymer dressing specifications for automated visual tracking.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Wound Name */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Wound Name / Identifier *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Post-Op Abdominal Incision"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-teal-500 transition-colors font-medium"
            />
          </div>

          {/* Type & Location Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Wound Type *
              </label>
              <select
                value={woundType}
                onChange={(e) => setWoundType(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:outline-teal-500"
              >
                {woundTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Anatomical Location *
              </label>
              <select
                value={bodyLocation}
                onChange={(e) => setBodyLocation(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:outline-teal-500"
              >
                {bodyLocations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Biopolymer Dressing Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Transparent Biopolymer Dressing Type *
            </label>
            <div className="relative">
              <select
                value={dressingType}
                onChange={(e) => setDressingType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-teal-50/50 border border-teal-200 rounded-xl text-slate-900 text-xs font-medium focus:bg-white focus:outline-teal-500 pr-8"
              >
                {biopolymerOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <Layers size={14} className="absolute right-3 top-3 text-teal-600 pointer-events-none" />
            </div>
            <span className="text-[10px] text-teal-700 mt-1 block">
              Enables optical compensation for surface reflection & transparent sheen.
            </span>
          </div>

          {/* Date first observed */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Date Dressing Applied / First Observed
            </label>
            <input
              type="date"
              value={firstObservedDate}
              onChange={(e) => setFirstObservedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs font-medium focus:bg-white focus:outline-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Clinical Context / Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Laparoscopic appendectomy closure. Suture removal scheduled in 10 days."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:bg-white focus:outline-teal-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold transition-all shadow-sm shadow-teal-500/30 flex items-center gap-2"
            >
              {loading ? 'Registering...' : 'Create Wound Record'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
