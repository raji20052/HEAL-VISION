import React from 'react';
import { ShieldAlert, Info } from 'lucide-react';

interface MedicalDisclaimerProps {
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-xs flex items-center gap-2.5">
        <Info size={16} className="text-teal-600 shrink-0" />
        <span className="leading-snug">
          <strong>Research Decision-Support Tool:</strong> Visual assessments are AI-assisted indicators and do not constitute a medical diagnosis. Always consult a qualified healthcare professional.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-r from-teal-50/70 via-slate-50 to-cyan-50/70 border border-teal-200/80 rounded-2xl text-slate-700 text-xs shadow-xs space-y-1">
      <div className="flex items-center gap-2 font-bold text-teal-900">
        <ShieldAlert size={16} className="text-teal-600" />
        <span>Academic & Clinical Decision-Support Notice</span>
      </div>
      <p className="text-slate-600 leading-relaxed pl-6">
        Smart Wound Healing Monitor is an academic research decision-support application. It analyzes wound image characteristics through transparent biopolymer dressings. 
        It does not diagnose bacterial infection or prescribe medical treatment. All outputs must be evaluated in collaboration with attending clinicians.
      </p>
    </div>
  );
};
