import React from 'react';
import { AIAnalysis } from '../../types';
import { Activity, Droplets, Info } from 'lucide-react';

interface ColorBreakdownChartProps {
  analysis?: AIAnalysis;
}

export const ColorBreakdownChart: React.FC<ColorBreakdownChartProps> = ({ analysis }) => {
  if (!analysis) return null;

  const gran = analysis.color_granulation_pct || 0;
  const slough = analysis.color_slough_pct || 0;
  const necro = analysis.color_necrotic_pct || 0;
  const pale = analysis.color_pale_pct || 0;

  const getExudateBadge = () => {
    switch (analysis.exudate_level) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Moderate':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Low':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'None':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
          <Activity size={16} className="text-teal-600" />
          <span>Tissue Composition & Colorimetry</span>
        </h4>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
          Primary: {analysis.tissue_classification}
        </span>
      </div>

      {/* Stacked Progress Bar */}
      <div className="space-y-1.5">
        <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner border border-slate-200/80">
          {gran > 0 && (
            <div
              style={{ width: `${gran}%` }}
              className="bg-gradient-to-r from-rose-500 to-rose-400 h-full transition-all duration-500"
              title={`Granulation: ${gran}%`}
            />
          )}
          {slough > 0 && (
            <div
              style={{ width: `${slough}%` }}
              className="bg-amber-400 h-full transition-all duration-500"
              title={`Slough: ${slough}%`}
            />
          )}
          {necro > 0 && (
            <div
              style={{ width: `${necro}%` }}
              className="bg-slate-900 h-full transition-all duration-500"
              title={`Necrotic: ${necro}%`}
            />
          )}
          {pale > 0 && (
            <div
              style={{ width: `${pale}%` }}
              className="bg-cyan-200 h-full transition-all duration-500"
              title={`Epithelial: ${pale}%`}
            />
          )}
        </div>
      </div>

      {/* Numerical Percentages Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
            <span className="font-semibold text-rose-900 truncate">Granulation</span>
          </div>
          <div className="text-base font-bold text-rose-700">{gran}%</div>
          <span className="text-[10px] text-rose-600 block">Healthy Bed</span>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
            <span className="font-semibold text-amber-900 truncate">Slough / Fibrin</span>
          </div>
          <div className="text-base font-bold text-amber-700">{slough}%</div>
          <span className="text-[10px] text-amber-600 block">Cellular Debris</span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 shrink-0" />
            <span className="font-semibold text-slate-800 truncate">Necrotic Eschar</span>
          </div>
          <div className="text-base font-bold text-slate-900">{necro}%</div>
          <span className="text-[10px] text-slate-500 block">Non-Viable</span>
        </div>

        <div className="p-2.5 rounded-xl bg-cyan-50/70 border border-cyan-100">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
            <span className="font-semibold text-cyan-900 truncate">Epithelial</span>
          </div>
          <div className="text-base font-bold text-cyan-800">{pale}%</div>
          <span className="text-[10px] text-cyan-600 block">Advancing Edge</span>
        </div>
      </div>

      {/* Fluid / Exudate Row */}
      <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-cyan-600" />
          <span className="font-semibold text-slate-700">Dressing Moisture / Fluid Index:</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full font-bold border ${getExudateBadge()}`}>
            {analysis.exudate_level} Level ({analysis.exudate_area_pct}% coverage)
          </span>
        </div>
      </div>

    </div>
  );
};
