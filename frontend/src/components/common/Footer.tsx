import React from 'react';
import { Activity, ShieldCheck, Heart } from 'lucide-react';
import { MedicalDisclaimerBanner } from './MedicalDisclaimerBanner';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        
        {/* Top Disclaimer in Footer */}
        <div className="max-w-4xl mx-auto">
          <MedicalDisclaimerBanner />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-6 border-t border-slate-800">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-bold">
                <Activity size={16} />
              </div>
              <span className="text-white font-bold text-base tracking-tight">Smart Wound Healing Monitor</span>
            </div>
            <p className="text-xs text-slate-400 max-w-md leading-relaxed">
              Research and clinical decision-support platform for non-invasive assessment of biopolymer wound dressings 
              using computer vision, colorimetry, and longitudinal image sequence tracking.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Research Technology</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Biopolymer Dressing Imaging</li>
              <li>HSV / CIELAB Tissue Colorimetry</li>
              <li>Laplacian Optical Quality Audit</li>
              <li>Telemedicine Physician Sharing</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-xs uppercase tracking-wider">Safety & Privacy</h4>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-teal-400" /> RBAC Patient Isolation</li>
              <li>Non-Invasive Visual Tracking</li>
              <li>Clinical Decision Support</li>
              <li>Version v1.2.0-research</li>
            </ul>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} HEAL VISION AI Research. All rights reserved.</p>
          <p className="flex items-center gap-1 mt-2 sm:mt-0">
            Engineered for Advanced Biopolymer Wound Monitoring
          </p>
        </div>

      </div>
    </footer>
  );
};
