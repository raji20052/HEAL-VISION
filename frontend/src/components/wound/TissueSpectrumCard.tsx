import React from 'react';
import { Activity, Droplets, Info, Sparkles } from 'lucide-react';
import { AIAnalysis } from '../../types';

interface TissueSpectrumCardProps {
  analysis: AIAnalysis;
}

export const TissueSpectrumCard: React.FC<TissueSpectrumCardProps> = ({ analysis }) => {
  const granulation = analysis.color_granulation_pct || 0;
  const slough = analysis.color_slough_pct || 0;
  const necrotic = analysis.color_necrotic_pct || 0;
  const pale = analysis.color_pale_pct || 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
      
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Activity size={16} className="text-teal-600" />
            <span>4-Color Tissue Spectrum & Exudate Index</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Colorimetry in CIELAB/HSV spaces calibrated for transparent dressings
          </p>
        </div>

        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
          {analysis.tissue_classification || 'Mixed Bed'}
        </span>
      </div>

      {/* Stacked Color Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>Tissue Composition Breakdown</span>
          <span className="text-teal-700 font-mono">{granulation}% Granulation</span>
        </div>

        <div className="h-3.5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
          <div
            className="bg-rose-500 h-full transition-all duration-500"
            style={{ width: `${granulation}%` }}
            title={`Granulation Red/Pink: ${granulation}%`}
          />
          <div
            className="bg-amber-400 h-full transition-all duration-500"
            style={{ width: `${slough}%` }}
            title={`Slough Yellow: ${slough}%`}
          />
          <div
            className="bg-slate-900 h-full transition-all duration-500"
            style={{ width: `${necrotic}%` }}
            title={`Necrotic Dark: ${necrotic}%`}
          />
          <div
            className="bg-cyan-200 h-full transition-all duration-500"
            style={{ width: `${pale}%` }}
            title={`Epithelial Pale: ${pale}%`}
          />
        </div>
      </div>

      {/* 4 Tissue Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        
        <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-rose-800 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span>Granulation</span>
          </div>
          <div className="text-lg font-black text-rose-950 font-mono">{granulation}%</div>
          <span className="text-[10px] text-rose-600 block leading-none">Vascular tissue</span>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-amber-800 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span>Slough / Fibrin</span>
          </div>
          <div className="text-lg font-black text-amber-950 font-mono">{slough}%</div>
          <span className="text-[10px] text-amber-600 block leading-none">Fibrinous debris</span>
        </div>

        <div className="p-3 bg-slate-100/70 border border-slate-200 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
            <span>Necrotic Eschar</span>
          </div>
          <div className="text-lg font-black text-slate-950 font-mono">{necrotic}%</div>
          <span className="text-[10px] text-slate-500 block leading-none">Non-viable eschar</span>
        </div>

        <div className="p-3 bg-cyan-50/70 border border-cyan-100 rounded-2xl space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-800 font-bold text-[11px]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shrink-0" />
            <span>Epithelial Margin</span>
          </div>
          <div className="text-lg font-black text-cyan-950 font-mono">{pale}%</div>
          <span className="text-[10px] text-cyan-600 block leading-none">Closure margin</span>
        </div>

      </div>

      {/* Exudate & Moisture Index */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
            <Droplets size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-800 block">Visible Exudate & Fluid Level</span>
            <span className="text-[11px] text-slate-500">
              Detected glistening patterns under biopolymer film
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`inline-block font-extrabold text-xs px-2.5 py-0.5 rounded-full border ${
            analysis.exudate_level === 'High'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : analysis.exudate_level === 'Moderate'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {analysis.exudate_level || 'None'} Exudate
          </span>
          <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
            {analysis.exudate_area_pct}% coverage
          </span>
        </div>
      </div>

    </div>
  );
};
