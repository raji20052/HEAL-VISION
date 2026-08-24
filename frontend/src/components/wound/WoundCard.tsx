import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, Calendar, Camera, ArrowRight, 
  TrendingDown, User, Share2 
} from 'lucide-react';
import { WoundSummary } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface WoundCardProps {
  wound: WoundSummary;
  onQuickCapture?: (wound: WoundSummary) => void;
  onQuickShare?: (wound: WoundSummary) => void;
}

export const WoundCard: React.FC<WoundCardProps> = ({
  wound,
  onQuickCapture,
  onQuickShare
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-4">
      
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
              Wound #{wound.id.slice(0, 6)}
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug truncate">
              {wound.name}
            </h3>
          </div>
          <StatusBadge status={wound.latest_status} size="sm" />
        </div>

        {/* Location & Dressing Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md">
            {wound.body_location}
          </span>
          <span className="bg-teal-50 text-teal-800 font-semibold px-2.5 py-0.5 rounded-md border border-teal-100">
            {wound.dressing_type.split(' ')[0]} Dressing
          </span>
        </div>
      </div>

      {/* Metric Stats Strip */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Photo</span>
          <span className="font-bold text-slate-800 text-[11px]">
            {wound.latest_image_date || 'Day 1'}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Captures</span>
          <span className="font-bold text-slate-800 text-[11px]">
            {wound.image_count} Photos
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">Contraction</span>
          <span className={`font-bold text-[11px] ${
            wound.area_reduction_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {wound.area_reduction_pct > 0
              ? `-${wound.area_reduction_pct}%`
              : `${wound.area_reduction_pct}%`}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {onQuickCapture && (
            <button
              type="button"
              onClick={() => onQuickCapture(wound)}
              className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
              title="Capture Image"
            >
              <Camera size={15} />
            </button>
          )}

          {onQuickShare && (
            <button
              type="button"
              onClick={() => onQuickShare(wound)}
              className="p-2 rounded-xl text-slate-500 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 transition-colors"
              title="Share with Doctor"
            >
              <Share2 size={15} />
            </button>
          )}
        </div>

        <Link
          to={`/wounds/${wound.id}`}
          className="px-4 py-2 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <span>View Details</span>
          <ArrowRight size={14} />
        </Link>
      </div>

    </div>
  );
};
