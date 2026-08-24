import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Stethoscope, CheckCircle2, 
  ShieldCheck, ArrowRight, UserCheck, AlertCircle, 
  Trash2, ExternalLink, Plus, Clock, Key 
} from 'lucide-react';
import { api } from '../../services/api';
import { WoundSummary } from '../../types';
import { Modal } from '../../components/common/Modal';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

interface DoctorItem {
  id: string;
  name: string;
  email: string;
  specialty: string;
  hospital: string;
  avatar_url?: string;
}

interface SharedRecord {
  id: string;
  wound_id: string;
  wound_name: string;
  doctor_id?: string;
  doctor_name: string;
  doctor_email: string;
  specialty: string;
  hospital: string;
  avatar_url?: string;
  permissions: string;
  share_token: string;
  created_at: string;
  expires_at: string;
}

export const DoctorsSharingPage: React.FC = () => {
  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [sharedRecords, setSharedRecords] = useState<SharedRecord[]>([]);
  const [availableDoctors, setAvailableDoctors] = useState<DoctorItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedWoundId, setSelectedWoundId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [customDoctorEmail, setCustomDoctorEmail] = useState<string>('');
  const [permissions, setPermissions] = useState<string>('can_comment');
  const [expiresInDays, setExpiresInDays] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);

  // Manage Share Modal
  const [selectedShareToManage, setSelectedShareToManage] = useState<SharedRecord | null>(null);

  // Search & Feedback
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [woundsList, sharesList, doctorsList] = await Promise.all([
        api.wounds.list().catch(() => []),
        api.sharing.getMyShares().catch(() => []),
        api.sharing.listDoctors().catch(() => [])
      ]);

      setWounds(woundsList);
      setSharedRecords(sharesList);
      setAvailableDoctors(doctorsList);

      if (woundsList.length > 0 && !selectedWoundId) {
        setSelectedWoundId(woundsList[0].id);
      }
      if (doctorsList.length > 0 && !selectedDoctorId) {
        setSelectedDoctorId(doctorsList[0].id);
      }
    } catch (err) {
      console.error('Failed to load sharing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenShareModal = (preselectedDoctorId?: string) => {
    if (preselectedDoctorId) {
      setSelectedDoctorId(preselectedDoctorId);
      setCustomDoctorEmail('');
    }
    if (wounds.length > 0 && !selectedWoundId) {
      setSelectedWoundId(wounds[0].id);
    }
    setErrorMessage(null);
    setShowShareModal(true);
  };

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWoundId) {
      setErrorMessage('Please select a wound record to share.');
      return;
    }
    if (!selectedDoctorId && !customDoctorEmail.trim()) {
      setErrorMessage('Please select a doctor from the list or enter a doctor email address.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const payload: any = {
        wound_id: selectedWoundId,
        permissions: permissions,
        expires_in_days: expiresInDays > 0 ? expiresInDays : undefined
      };

      if (customDoctorEmail.trim()) {
        payload.doctor_email = customDoctorEmail.trim();
      } else {
        payload.doctor_id = selectedDoctorId;
        const matchedDoc = availableDoctors.find(d => d.id === selectedDoctorId);
        if (matchedDoc) {
          payload.doctor_email = matchedDoc.email;
        }
      }

      await api.sharing.share(payload);
      setShowShareModal(false);
      setSuccessMessage('Wound record successfully shared with doctor for clinical review!');
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to share wound record. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!window.confirm('Are you sure you want to revoke this doctor\'s access to your wound record?')) {
      return;
    }

    try {
      await api.sharing.revoke(shareId);
      setSelectedShareToManage(null);
      setSuccessMessage('Doctor access successfully revoked.');
      setTimeout(() => setSuccessMessage(null), 4000);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Failed to revoke access.');
    }
  };

  const filteredDoctors = availableDoctors.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.hospital.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Doctors
          </h2>
          <p className="text-xs text-slate-400">
            Share and manage physician telemedicine access to your wound assessments
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenShareModal()}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus size={15} />
          <span>Share a Wound</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Section 1: Shared Doctors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">
            Active Shared Consultations ({sharedRecords.length})
          </h3>
        </div>

        {sharedRecords.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 text-center space-y-2">
            <Users size={28} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No active doctor consultations shared yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Share your wound images and AI healing trends with an accredited physician for clinical guidance.
            </p>
            <button
              type="button"
              onClick={() => handleOpenShareModal()}
              className="mt-2 px-4 py-2 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Share Your First Wound</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sharedRecords.map((share) => (
              <div
                key={share.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <img
                    src={share.avatar_url || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'}
                    alt={share.doctor_name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div className="space-y-0.5 text-xs">
                    <h4 className="font-extrabold text-slate-900 text-sm">{share.doctor_name}</h4>
                    <p className="text-slate-500">{share.specialty}</p>
                    <p className="text-slate-400 text-[11px]">{share.hospital}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {share.wound_name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Shared on: {share.created_at}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedShareToManage(share)}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRevokeShare(share.id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Revoke physician access"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Find a Doctor */}
      <div className="space-y-4 pt-2">
        <h3 className="font-extrabold text-sm text-slate-900">Find a Healthcare Specialist</h3>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctor by name, specialty, or clinic..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-teal-500 shadow-xs"
          />
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={doc.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'}
                  alt={doc.name}
                  className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="space-y-0.5 text-xs min-w-0">
                  <h4 className="font-bold text-slate-900 truncate">{doc.name}</h4>
                  <p className="text-slate-500 text-[11px] truncate">{doc.specialty}</p>
                  <p className="text-slate-400 text-[10px] truncate">{doc.hospital}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenShareModal(doc.id)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs transition-all"
              >
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Share Wound Dialog */}
      <Modal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title="Share Wound Record"
        subtitle="Grant a physician secure telemedicine access"
        maxWidth="md"
      >
        <form onSubmit={handleShareSubmit} className="space-y-4 text-xs">
          
          {/* Wound Selector */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">Select Wound to Share</label>
            {wounds.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                No wounds registered yet. Please create a wound first in the "My Wounds" section.
              </div>
            ) : (
              <select
                value={selectedWoundId}
                onChange={(e) => setSelectedWoundId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-teal-500"
              >
                {wounds.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.body_location}) - Status: {w.status}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Doctor Selection */}
          <div className="space-y-2 pt-1">
            <label className="block font-bold text-slate-700">Select Doctor or Enter Email</label>
            
            <div className="max-h-44 overflow-y-auto space-y-2 border border-slate-100 p-1 rounded-xl">
              {availableDoctors.map((doc) => (
                <label
                  key={doc.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    selectedDoctorId === doc.id && !customDoctorEmail
                      ? 'border-teal-500 bg-teal-50/50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="doctor"
                    value={doc.id}
                    checked={selectedDoctorId === doc.id && !customDoctorEmail}
                    onChange={() => {
                      setSelectedDoctorId(doc.id);
                      setCustomDoctorEmail('');
                    }}
                    className="w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate">{doc.name}</span>
                    <span className="text-slate-500 text-[11px] block truncate">{doc.specialty} • {doc.hospital}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Custom Doctor Email */}
            <div className="space-y-1 pt-1">
              <span className="text-[11px] text-slate-500 font-medium">Or enter doctor's email directly:</span>
              <input
                type="email"
                value={customDoctorEmail}
                onChange={(e) => {
                  setCustomDoctorEmail(e.target.value);
                  if (e.target.value) setSelectedDoctorId('');
                }}
                placeholder="doctor.name@hospital.com"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-teal-500"
              />
            </div>
          </div>

          {/* Permissions & Expiration */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Access Level</label>
              <select
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value="can_comment">View & Clinical Notes</option>
                <option value="read_only">View Only</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-slate-700">Access Expiry</label>
              <select
                value={expiresInDays}
                onChange={(e) => setExpiresInDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
                <option value={0}>No Expiration</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || wounds.length === 0}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition-all mt-2"
          >
            {submitting ? 'Sharing with Doctor...' : 'Confirm & Share Wound Record'}
          </button>

        </form>
      </Modal>

      {/* Manage Share Modal */}
      {selectedShareToManage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedShareToManage(null)}
          title="Manage Physician Access"
          subtitle={`Consultation for ${selectedShareToManage.wound_name}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Physician:</span>
                <span className="font-bold text-slate-900">{selectedShareToManage.doctor_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Hospital / Clinic:</span>
                <span className="font-bold text-slate-800">{selectedShareToManage.hospital}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Shared Wound:</span>
                <span className="font-bold text-teal-700">{selectedShareToManage.wound_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Permissions:</span>
                <span className="font-bold text-slate-900 capitalize">
                  {selectedShareToManage.permissions.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Access Expiry:</span>
                <span className="font-bold text-slate-900">{selectedShareToManage.expires_at}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleRevokeShare(selectedShareToManage.id)}
                className="flex-1 py-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Revoke Access</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedShareToManage(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
