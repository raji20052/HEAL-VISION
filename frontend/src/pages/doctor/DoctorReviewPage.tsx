import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Stethoscope, Plus } from 'lucide-react';
import { DoctorReviewForm } from '../../components/doctor/DoctorReviewForm';
import { Modal } from '../../components/common/Modal';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const DoctorReviewPage: React.FC = () => {
  const { woundId } = useParams<{ woundId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'progress' | 'notes'>('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="space-y-3">
        <Link
          to="/doctor/dashboard"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          <span>Back to Patients</span>
        </Link>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              John Doe
            </h2>
            <p className="text-xs text-slate-500">
              Wound #001 <span className="text-slate-300 mx-1">•</span> Post-surgical wound
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
              Improving
            </span>

            <button
              type="button"
              onClick={() => setShowReviewModal(true)}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Add Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'images', label: 'Images' },
          { id: 'progress', label: 'Progress' },
          { id: 'notes', label: 'Notes' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'progress') navigate('/progress');
              else setActiveTab(tab.id as any);
            }}
            className={`pb-3 transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-teal-600 text-teal-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Latest Image (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">Latest Image</h3>

          <div className="relative aspect-4/3 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src="/storage/images/sample_wound_day14.jpg"
              alt="Latest Wound"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          <div className="text-xs text-slate-400">
            20 Aug 2026
          </div>
        </div>

        {/* Right Column: AI Assessment & Patient Info (6 cols) */}
        <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">AI Assessment</h3>

          <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
            <div className="text-emerald-700 font-extrabold text-sm flex items-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>Improving</span>
            </div>
            <p className="text-xs text-emerald-950 leading-relaxed">
              Visual indicators appear consistent with healing progression.
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Confidence:</span>
              <span className="font-bold text-slate-900 font-mono">82%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '82%' }} />
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            Image-based assessment only.
          </p>

          {/* Patient Meta Strip */}
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Patient Info</span>
              <strong className="text-slate-800 block">Age: 45</strong>
              <span className="text-slate-500 text-[11px] block">Gender: Male</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Monitoring Duration</span>
              <strong className="text-slate-800 block">14 days</strong>
              <span className="text-slate-500 text-[11px] block">Total Images: 4</span>
            </div>
          </div>
        </div>

      </div>

      <MedicalDisclaimer compact={true} />

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Record Clinical Review Note"
        subtitle="John Doe - Wound #001"
        maxWidth="lg"
      >
        <DoctorReviewForm
          woundId={woundId || 'wound-001'}
          onSuccess={() => setShowReviewModal(false)}
        />
      </Modal>

    </div>
  );
};
