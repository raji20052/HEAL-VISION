import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface QualityCheckCardProps {
  status: 'PASS' | 'WARNING' | 'FAIL';
  metrics?: {
    blur_score?: number;
    brightness?: number;
    contrast?: number;
    glare_ratio_pct?: number;
    resolution?: string;
  };
  issues?: string[];
}

export const QualityCheckCard: React.FC<QualityCheckCardProps> = ({
  status,
  metrics,
  issues = []
}) => {
  const isPass = status === 'PASS';
  const isWarning = status === 'WARNING';

  return (
    <div
      className={`p-4 rounded-2xl border text-xs space-y-3 transition-all ${
        isPass
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : isWarning
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-rose-50/70 border-rose-200 text-rose-950'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-extrabold text-sm">
          {isPass ? (
            <CheckCircle2 size={18} className="text-emerald-600" />
          ) : isWarning ? (
            <AlertTriangle size={18} className="text-amber-600" />
          ) : (
            <AlertCircle size={18} className="text-rose-600" />
          )}
          <span>
            {isPass
              ? 'Image Quality Check Passed'
              : isWarning
              ? 'Acceptable with Optical Warnings'
              : 'Insufficient Image Quality'}
          </span>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
            isPass
              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
              : isWarning
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-rose-100 text-rose-800 border-rose-300'
          }`}
        >
          {status}
        </span>
      </div>

      <p className="text-[11px] opacity-90 leading-relaxed">
        {isPass
          ? 'Image resolution, focal sharpness, and illumination through the biopolymer dressing are optimal for computer vision feature extraction.'
          : isWarning
          ? 'Image is usable for monitoring, though minor glare or slight focal softness was detected. Results should be interpreted with caution.'
          : 'Image is too blurry, dark, or has severe specular reflection. Please capture a new image before clinical evaluation.'}
      </p>

      {/* Metrics breakdown */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-black/5 text-[11px] font-medium">
          <div>
            <span className="opacity-60 block text-[10px] uppercase">Focus / Sharpness</span>
            <strong>{metrics.blur_score ? (metrics.blur_score > 50 ? 'Sharp' : 'Moderate') : 'Optimal'}</strong>
          </div>
          <div>
            <span className="opacity-60 block text-[10px] uppercase">Illumination</span>
            <strong>{metrics.brightness ? Math.round(metrics.brightness) : 'Balanced'}</strong>
          </div>
          <div>
            <span className="opacity-60 block text-[10px] uppercase">Dressing Glare</span>
            <strong>{metrics.glare_ratio_pct ? `${metrics.glare_ratio_pct}%` : 'Low (<3%)'}</strong>
          </div>
          <div>
            <span className="opacity-60 block text-[10px] uppercase">Resolution</span>
            <strong>{metrics.resolution || 'High Definition'}</strong>
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-1 pt-1">
          <span className="font-bold text-[10px] uppercase">Improvement Guidance:</span>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
            {issues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
