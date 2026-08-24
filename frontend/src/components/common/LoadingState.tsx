import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subtext?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  subtext
}) => {
  return (
    <div className="py-16 text-center space-y-3">
      <Loader2 size={28} className="animate-spin mx-auto text-teal-600" />
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-700">{message}</p>
        {subtext && <p className="text-[11px] text-slate-400">{subtext}</p>}
      </div>
    </div>
  );
};
