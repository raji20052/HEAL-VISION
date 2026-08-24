import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { MonitoringStatus } from '../../types';

interface StatusBadgeProps {
  status: MonitoringStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'healing_normally':
      case 'improving':
        return {
          label: 'Improving / Healing Normally',
          shortLabel: 'Improving',
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: CheckCircle2
        };
      case 'needs_monitoring':
      case 'stable':
        return {
          label: 'Needs Monitoring',
          shortLabel: 'Needs Monitoring',
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: AlertTriangle
        };
      case 'possible_abnormal_change':
      case 'worsening':
      case 'needs_attention':
        return {
          label: 'Possible Abnormal Change',
          shortLabel: 'Abnormal Change',
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          icon: AlertCircle
        };
      case 'insufficient_quality':
      default:
        return {
          label: 'Insufficient Information',
          shortLabel: 'Insufficient Info',
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          icon: HelpCircle
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-bold'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-tight shrink-0 ${config.bg} ${sizeClasses[size]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {showIcon && <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} className="shrink-0" />}
      <span>{size === 'sm' ? config.shortLabel : config.label}</span>
    </span>
  );
};
