import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface MedicalDisclaimerBannerProps {
  compact?: boolean;
}

export const MedicalDisclaimerBanner: React.FC<MedicalDisclaimerBannerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2 text-xs text-amber-900 leading-relaxed shadow-sm">
        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Research & Decision Support Tool:</span> AI visual assessments are calculated for monitoring assistance and do not constitute a definitive medical diagnosis. Always consult your physician.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
          <ShieldAlert size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Important Healthcare & AI Research Disclaimer
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            This application is designed as a research and clinical decision-support monitoring tool based on 
            <em> “Computer Vision-Based Assessment of Biopolymer Wound Dressings.”</em> AI-generated metrics are derived from 
            surface photography through transparent biopolymer dressings and <strong>are not a definitive medical diagnosis</strong>. 
            Factors including lighting, distance, and dressing optics can impact results. Always seek the advice of a qualified 
            healthcare provider with any medical questions.
          </p>
        </div>
      </div>
    </div>
  );
};
