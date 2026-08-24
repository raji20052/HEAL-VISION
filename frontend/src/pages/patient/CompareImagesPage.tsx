import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Sliders, Activity } from 'lucide-react';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const CompareImagesPage: React.FC = () => {
  const navigate = useNavigate();
  const [fromDay, setFromDay] = useState('01 Aug 2026');
  const [toDay, setToDay] = useState('20 Aug 2026');

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Compare Images
            </h2>
            <p className="text-xs text-slate-400">
              Wound #001
            </p>
          </div>
        </div>
      </div>

      {/* Date Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600">From</label>
          <select
            value={fromDay}
            onChange={(e) => setFromDay(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-teal-500"
          >
            <option value="01 Aug 2026">Day 1 (01 Aug 2026)</option>
            <option value="07 Aug 2026">Day 7 (07 Aug 2026)</option>
            <option value="14 Aug 2026">Day 14 (14 Aug 2026)</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600">To</label>
          <select
            value={toDay}
            onChange={(e) => setToDay(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-teal-500"
          >
            <option value="20 Aug 2026">Today (20 Aug 2026)</option>
            <option value="18 Aug 2026">18 Aug 2026</option>
            <option value="14 Aug 2026">14 Aug 2026</option>
          </select>
        </div>
      </div>

      {/* 2-Column Comparison Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Previous Image */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Previous Image</span>
            <span className="text-slate-400 font-normal">{fromDay}</span>
          </div>

          <div className="relative aspect-4/3 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src="/storage/images/sample_wound_day1.jpg"
              alt="Previous Wound"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>
        </div>

        {/* Current Image */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Current Image</span>
            <span className="text-slate-400 font-normal">{toDay}</span>
          </div>

          <div className="relative aspect-4/3 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src="/storage/images/sample_wound_day14.jpg"
              alt="Current Wound"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&auto=format&fit=crop&q=80';
              }}
            />
          </div>
        </div>

      </div>

      {/* Bottom Row: Visual Difference & Change Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
        
        {/* Visual Difference */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2">
          <h3 className="font-extrabold text-xs text-slate-800">
            Visual Difference
          </h3>

          <div className="relative aspect-4/3 max-h-60 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src="/storage/heatmaps/sample_wound_day14_heatmap.png"
              alt="Visual Difference Heatmap"
              className="max-h-full max-w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/storage/images/sample_wound_day14.jpg';
              }}
            />
          </div>
        </div>

        {/* Change Summary Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="font-extrabold text-xs text-slate-800">
            Change Summary
          </h3>

          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
              <span>Wound region appears reduced</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
              <span>Redness has decreased</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 shrink-0" />
              <span>Overall visual improvement detected</span>
            </li>
          </ul>

          <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-100">
            AI-based visual comparison only.
          </p>
        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
