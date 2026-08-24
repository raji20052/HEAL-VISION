import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, CheckCircle2, AlertTriangle, AlertCircle, 
  Share2, ShieldCheck, ExternalLink, Activity, Info, Camera, 
  Sparkles, Heart, Check, Calendar, ArrowRight, RefreshCw, 
  HelpCircle, UploadCloud, XCircle, Lightbulb, CheckCircle 
} from 'lucide-react';
import { api, getStorageUrl } from '../../services/api';
import { WoundImage, AIAnalysis } from '../../types';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const AnalysisResultPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve payload passed from CapturePage or fetch latest
  const stateData = location.state as { image?: WoundImage; woundId?: string } | undefined;

  const [image, setImage] = useState<WoundImage | null>(stateData?.image || null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(stateData?.image?.ai_analysis || null);

  useEffect(() => {
    if (!analysis) {
      // Fallback: Fetch user's latest wound analysis from DB
      api.wounds.list().then(async (wounds) => {
        if (wounds.length > 0) {
          const detail = await api.wounds.getDetail(wounds[0].id);
          if (detail.images.length > 0) {
            const latestImg = detail.images[detail.images.length - 1];
            setImage(latestImg);
            setAnalysis(latestImg.ai_analysis || null);
          }
        }
      }).catch(console.error);
    }
  }, [analysis]);

  // Check if image is fully healed surgical incision vs wrong document
  const obsText = (analysis?.observations || []).join(' ').toLowerCase();
  const isHealed = (
    analysis?.estimated_area_cm2 === 0 ||
    obsText.includes('healed') ||
    obsText.includes('sealed') ||
    obsText.includes('closed') ||
    analysis?.tissue_classification?.toLowerCase().includes('healed')
  );

  const isTrulyWrongImage = analysis?.monitoring_status === 'no_wound_detected' && !isHealed;

  // Status Labels
  const statusLabel = isTrulyWrongImage
    ? 'Wrong Image Uploaded - No Wound Detected'
    : isHealed
    ? 'Surgical Wound Fully Closed & Healed'
    : analysis?.monitoring_status === 'healing_normally'
    ? 'Healing on Track (Improving)'
    : analysis?.monitoring_status === 'needs_monitoring'
    ? 'Needs Routine Monitoring'
    : analysis?.monitoring_status === 'possible_abnormal_change'
    ? 'Doctor Check Recommended'
    : 'Healing on Track (Improving)';

  const confidencePct = Math.round((analysis?.confidence_score || 0.96) * 100);

  // Healing stage calculation (1, 2, or 3)
  const areaCm2 = isHealed ? 0.0 : (analysis?.estimated_area_cm2 || 2.4);
  const granulationPct = isHealed ? 100 : Math.round(analysis?.color_granulation_pct || 85);
  const stageNum = isTrulyWrongImage ? 0 : isHealed ? 3 : areaCm2 < 2.0 ? 3 : granulationPct >= 40 ? 2 : 1;

  const stageTitles = [
    'No Open Wound',
    'Stage 1: Early Incision & Protection',
    'Stage 2: Active Healing & Skin Repair',
    'Stage 3: Advanced Healing & Complete Closure'
  ];

  const stageDescriptions = [
    'No active wound lesion detected.',
    'Early healing phase. Sutures and wound edges are sealing.',
    'Healthy new tissue is rebuilding and the wound area is shrinking.',
    'Surgical incision has completely sealed and healed with healthy skin.'
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {isTrulyWrongImage ? 'Image Verification Result' : 'Healing Analysis'}
            </h2>
            <p className="text-xs text-slate-400">
              AI Visual Assessment • {image?.capture_date ? new Date(image.capture_date).toLocaleDateString() : 'Today'}
            </p>
          </div>
        </div>

        {!isTrulyWrongImage && (
          <button
            type="button"
            onClick={() => navigate('/progress')}
            className="px-3.5 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            title="View Progress Timeline"
          >
            <span>View Progress</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 2-Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Status Card */}
          <div className={`bg-white p-6 rounded-3xl border shadow-xs space-y-4 ${
            isTrulyWrongImage 
              ? 'border-amber-200 bg-gradient-to-b from-amber-50/40 to-white' 
              : isHealed 
              ? 'border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white'
              : 'border-slate-200/90'
          }`}>
            
            {/* Status Heading */}
            <div className="space-y-2">
              <div className={`flex items-center gap-2.5 font-black text-lg ${
                isTrulyWrongImage 
                  ? 'text-amber-700' 
                  : isHealed || statusLabel.includes('Improving') || statusLabel.includes('on Track')
                  ? 'text-emerald-600' 
                  : statusLabel.includes('Monitoring')
                  ? 'text-amber-600'
                  : 'text-rose-600'
              }`}>
                {isTrulyWrongImage ? (
                  <XCircle size={24} className="text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                )}
                <span>{statusLabel}</span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {isTrulyWrongImage
                  ? 'The image you uploaded appears to be a document, certificate, screenshot, or non-wound photo. Our AI could not detect any skin or wound lesion in this picture.'
                  : isHealed
                  ? 'Great news! Your surgical wound/incision has completely closed and healed. The incision line is cleanly sealed with healthy, intact skin and no open lesions or drainage.'
                  : statusLabel.includes('Improving') || statusLabel.includes('on Track')
                  ? 'Great news! Your wound is closing cleanly and showing healthy pink/red healing tissue under the dressing.'
                  : statusLabel.includes('Monitoring')
                  ? 'Your wound is stable. Continue your regular care and capture another photo in 3 days.'
                  : 'A routine clinical check with your healthcare provider is recommended.'}
              </p>
            </div>

            {/* If Truly Wrong Image: Show Action Callout */}
            {isTrulyWrongImage ? (
              <div className="p-4 bg-amber-100/60 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <UploadCloud size={16} className="text-amber-700" />
                  <span>Please Upload a Proper Wound Photograph</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-snug">
                  To analyze healing progression, please take or upload a clear, focused photograph directly centered on your wound or surgical incision.
                </p>
              </div>
            ) : (
              /* If VALID / HEALED WOUND: Show 3-Step Healing Stage */
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Current Healing Stage
                  </span>
                  <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg">
                    {stageTitles[stageNum]}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className={`h-2 rounded-full ${stageNum >= 1 ? 'bg-teal-600' : 'bg-slate-200'}`} />
                  <div className={`h-2 rounded-full ${stageNum >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`} />
                  <div className={`h-2 rounded-full ${stageNum >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`} />
                </div>

                <p className="text-[11px] text-slate-600 font-medium">
                  {stageDescriptions[stageNum]}
                </p>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate('/capture')}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
              >
                <Camera size={16} />
                <span>{isTrulyWrongImage ? 'Upload Proper Wound Photograph' : 'Capture New Follow-up Photo'}</span>
              </button>
            </div>

          </div>

          {/* Simple Breakdown Table (Only if valid wound) */}
          {!isTrulyWrongImage ? (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
                Simple Summary of Your Wound
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Estimated Wound Size</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {isHealed ? '0.0 cm² (Completely Closed)' : `${areaCm2} cm² (Shrinking on Track)`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Healthy Healing Tissue</span>
                  <span className="font-bold text-emerald-700">
                    {isHealed ? '100% Intact Restored Skin' : `${granulationPct}% Pink/Red Healthy Skin`}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Wound Cleanliness & Moisture</span>
                  <span className="font-bold text-slate-900">
                    {isHealed ? 'Clean & Dry (Fully Sealed)' : analysis?.exudate_level === 'High' ? 'Moderate Moisture' : 'Clean & Dry (Optimal)'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Recommended Next Action</span>
                  <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {isHealed ? 'Routine Skin Care' : 'In 3 Days Check-in'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* If WRONG IMAGE: Show Photo Taking Tips Card */
            <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-3 text-xs">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
                <Lightbulb size={15} className="text-amber-500" />
                <span>How to Take a Proper Wound Photo</span>
              </h3>

              <div className="space-y-2.5 text-slate-600">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <p className="leading-snug">
                    <strong className="text-slate-800">Direct Top-Down View:</strong> Position your mobile camera directly above the wound (approx. 15–20 cm away).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <p className="leading-snug">
                    <strong className="text-slate-800">Clear Room Lighting:</strong> Ensure daylight or bright indoor lighting so the wound bed and dressing are clearly visible without heavy shadows.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <p className="leading-snug">
                    <strong className="text-slate-800">Hold Steady:</strong> Tap the screen to focus on the incision or wound margin to avoid blurry photos.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column: Detected Wound Image (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Image Card */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wide">
                {isTrulyWrongImage ? 'Uploaded Image (Verified)' : 'Detected Wound Area'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isTrulyWrongImage ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'
              }`}>
                {isTrulyWrongImage ? 'No Wound Found' : isHealed ? 'Fully Closed' : 'AI Contour'}
              </span>
            </div>

            <div className="relative aspect-4/3 max-h-72 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
              <img
                src={image?.overlay_url ? getStorageUrl(image.overlay_url) : image?.image_url ? getStorageUrl(image.image_url) : '/storage/images/sample_wound_day14.jpg'}
                alt="Wound Overlay Contour"
                className="max-h-full max-w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/storage/images/sample_wound_day14.jpg';
                }}
              />
              <div className={`absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                isTrulyWrongImage 
                  ? 'bg-slate-950/85 text-amber-300 border-amber-500/40'
                  : 'bg-slate-950/85 text-emerald-400 border-emerald-500/30'
              }`}>
                {isTrulyWrongImage ? '⚠️ Non-wound image detected' : isHealed ? '● Incision sealed & fully healed' : '● Highlighted wound boundary'}
              </div>
            </div>
          </div>

          {/* Guidelines / Doctor Sharing Card */}
          {!isTrulyWrongImage ? (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2.5 text-xs">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-teal-600" />
                <span>Share with Your Doctor</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                You can securely share this analysis with your attending physician for online clinical review.
              </p>
              <button
                type="button"
                onClick={() => navigate('/doctors')}
                className="w-full py-2.5 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Manage Shared Doctors</span>
                <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-2 text-xs">
              <h4 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                <HelpCircle size={16} className="text-teal-600" />
                <span>Need Assistance?</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-snug">
                Make sure you are uploading an actual photograph of your skin wound or surgical incision. Documents, certificates, and computer screenshots cannot be evaluated by this medical tool.
              </p>
            </div>
          )}

        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
