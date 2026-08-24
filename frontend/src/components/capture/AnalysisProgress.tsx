import React, { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle, Sparkles } from 'lucide-react';

interface AnalysisProgressProps {
  onComplete?: () => void;
  speedMs?: number;
}

const STAGES = [
  { id: 1, label: 'Optical Quality Check & Glare Detection' },
  { id: 2, label: 'Image Preprocessing & CIELAB Color Space Transformation' },
  { id: 3, label: 'Wound Boundary & Dressing Contour Segmentation' },
  { id: 4, label: '4-Color Tissue Spectrum & Exudate Feature Extraction' },
  { id: 5, label: 'Temporal Comparison with Baseline Image' },
  { id: 6, label: 'Synthesizing Decision-Support Monitoring Assessment' },
];

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  onComplete,
  speedMs = 450
}) => {
  const [currentStage, setCurrentStage] = useState(1);

  useEffect(() => {
    if (currentStage <= STAGES.length) {
      const timer = setTimeout(() => {
        if (currentStage === STAGES.length) {
          onComplete?.();
        } else {
          setCurrentStage((prev) => prev + 1);
        }
      }, speedMs);
      return () => clearTimeout(timer);
    }
  }, [currentStage, speedMs, onComplete]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-lg mx-auto space-y-6">
      
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto ring-4 ring-teal-50">
          <Sparkles size={24} className="animate-pulse text-teal-600" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Executing Computer Vision Pipeline
        </h3>
        <p className="text-xs text-slate-500">
          Extracting quantitative healing indicators through biopolymer dressing
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span>Analysis Progress</span>
          <span>{Math.round((currentStage / STAGES.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-300 rounded-full"
            style={{ width: `${(currentStage / STAGES.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Stage Checklist */}
      <div className="space-y-2.5 pt-2">
        {STAGES.map((stage) => {
          const isDone = currentStage > stage.id;
          const isCurrent = currentStage === stage.id;

          return (
            <div
              key={stage.id}
              className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs transition-all ${
                isDone
                  ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900 font-semibold'
                  : isCurrent
                  ? 'bg-teal-50 border-teal-200 text-teal-950 font-bold shadow-xs'
                  : 'bg-slate-50/50 border-slate-100 text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <Loader2 size={16} className="animate-spin text-teal-600 shrink-0" />
              ) : (
                <Circle size={16} className="text-slate-300 shrink-0" />
              )}
              <span className="truncate">{stage.label}</span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
