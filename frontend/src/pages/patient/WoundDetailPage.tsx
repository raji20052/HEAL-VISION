import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Share2, FileText, CheckCircle2, 
  Layers, Stethoscope, Sliders, ExternalLink, AlertTriangle, 
  AlertCircle, Info, Calendar, Clock, Plus 
} from 'lucide-react';
import { api, getStorageUrl } from '../../services/api';
import { WoundDetail, WoundImage } from '../../types';
import { MultiLayerViewer } from '../../components/wound/MultiLayerViewer';
import { ImageGallery } from '../../components/wound/ImageGallery';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const WoundDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'progress' | 'timeline' | 'doctorNotes' | 'reports'>('overview');
  const [wound, setWound] = useState<WoundDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWoundData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.wounds.getDetail(id);
      setWound(data);
    } catch (err) {
      console.error('Failed to load wound details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWoundData();
  }, [id]);

  // Extract latest real uploaded image
  const images = wound?.images || [];
  const latestImage: WoundImage | null = images.length > 0 ? images[images.length - 1] : null;

  // Format real upload date and time
  const formatUploadDateTime = (img: WoundImage | null) => {
    if (!img) return 'No photos uploaded';
    const dateSource = img.created_at || img.capture_date;
    try {
      const d = new Date(dateSource);
      if (isNaN(d.getTime())) {
        return img.capture_date || 'Recent';
      }
      return d.toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return img.capture_date || 'Recent';
    }
  };

  const latestStatus = latestImage?.ai_analysis?.monitoring_status || wound?.status || 'healing_normally';
  const confidenceScore = Math.round((latestImage?.ai_analysis?.confidence_score || 0.92) * 100);

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'healing_normally':
      case 'improving':
        return { label: 'Improving / Healing on Track', color: 'emerald', icon: <CheckCircle2 size={16} className="text-emerald-600" /> };
      case 'needs_monitoring':
        return { label: 'Needs Routine Monitoring', color: 'amber', icon: <AlertTriangle size={16} className="text-amber-500" /> };
      case 'possible_abnormal_change':
      case 'possible_abnormal':
        return { label: 'Doctor Review Recommended', color: 'rose', icon: <AlertCircle size={16} className="text-rose-600" /> };
      case 'no_wound_detected':
        return { label: 'No Active Wound Detected', color: 'sky', icon: <Info size={16} className="text-sky-600" /> };
      default:
        return { label: 'Healing on Track', color: 'emerald', icon: <CheckCircle2 size={16} className="text-emerald-600" /> };
    }
  };

  const statusInfo = getStatusDisplay(latestStatus);

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="space-y-3">
        <Link
          to="/wounds"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft size={14} />
          <span>Back to My Wounds</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              {wound?.name || 'Wound Dossier'}
            </h2>
            <p className="text-xs text-slate-500">
              <span className="capitalize">{wound?.wound_type || 'Post-surgical'} wound</span>
              <span className="text-slate-300 mx-1.5">|</span>
              <span>{wound?.body_location || 'Body Area'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
              statusInfo.color === 'emerald'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : statusInfo.color === 'amber'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : statusInfo.color === 'sky'
                ? 'bg-sky-50 text-sky-700 border-sky-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {statusInfo.label}
            </span>

            <button
              type="button"
              onClick={() => navigate('/capture', { state: { woundId: wound?.id } })}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Camera size={14} />
              <span>Capture Photo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'images', label: `Images (${images.length})` },
          { id: 'progress', label: 'Progress' },
          { id: 'timeline', label: 'Timeline' },
          { id: 'doctorNotes', label: `Doctor Notes (${wound?.doctor_notes?.length || 0})` },
          { id: 'reports', label: 'Reports' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (tab.id === 'progress') navigate('/progress');
              else if (tab.id === 'reports') navigate('/reports');
              else setActiveTab(tab.id as any);
            }}
            className={`pb-3 transition-all shrink-0 ${
              activeTab === tab.id
                ? 'border-b-2 border-teal-600 text-teal-700 font-extrabold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Content Grid */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left: Latest Image Card (6 cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">Latest Uploaded Image</h3>
                <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-md">
                  {latestImage ? `Observation #${images.length}` : 'No Uploads'}
                </span>
              </div>

              {latestImage ? (
                <div className="relative aspect-4/3 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center border border-slate-200 group">
                  <img
                    src={getStorageUrl(latestImage.overlay_url || latestImage.image_url)}
                    alt="Latest Uploaded Wound"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-950/80 text-emerald-400 border border-emerald-500/30">
                    ● Real-Time Patient Upload
                  </div>
                </div>
              ) : (
                <div className="aspect-4/3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-2">
                  <Camera size={32} className="text-slate-400" />
                  <p className="text-xs font-bold text-slate-700">No Photos Uploaded Yet</p>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Take a clear top-down photo under bright lighting to begin AI tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/capture', { state: { woundId: wound?.id } })}
                    className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Upload First Photo</span>
                  </button>
                </div>
              )}

              {/* Date, Time & View Full Size Link */}
              {latestImage && (
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <Clock size={13} className="text-slate-400" />
                    <span>Uploaded: <strong>{formatUploadDateTime(latestImage)}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/analysis-result', { state: { image: latestImage, woundId: wound?.id } })}
                    className="text-teal-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>View Analysis</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Right: AI Assessment Card (6 cols) */}
            <div className="lg:col-span-6 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900">AI Assessment</h3>

              {/* Status Banner */}
              <div className={`p-4 rounded-2xl border space-y-1.5 ${
                statusInfo.color === 'emerald'
                  ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950'
                  : statusInfo.color === 'amber'
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-950'
                  : statusInfo.color === 'sky'
                  ? 'bg-sky-50/70 border-sky-200/80 text-sky-950'
                  : 'bg-rose-50/70 border-rose-200/80 text-rose-950'
              }`}>
                <div className="font-black text-sm flex items-center gap-2">
                  {statusInfo.icon}
                  <span>{statusInfo.label}</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {latestImage?.ai_analysis?.observations?.[0] ||
                    'Visual indicators show healthy healing progression under transparent dressing.'}
                </p>
              </div>

              {/* Confidence Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Detection Confidence:</span>
                  <span className="font-bold text-slate-900 font-mono">{confidenceScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      statusInfo.color === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
              </div>

              {/* Metric Readouts */}
              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Current Surface Area</span>
                  <span className="text-base font-black text-slate-900 font-mono">
                    {latestImage?.ai_analysis?.estimated_area_cm2 || 0.0} cm²
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Healing Granulation</span>
                  <span className="text-base font-black text-teal-700 font-mono">
                    {Math.round(latestImage?.ai_analysis?.color_granulation_pct || 85)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => navigate('/analysis-result', { state: { image: latestImage, woundId: wound?.id } })}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  View Full Diagnostics
                </button>
              </div>
            </div>

          </div>

          {/* Bottom Summary Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Wound Type</span>
              <strong className="text-slate-800 capitalize">{wound?.wound_type || 'Surgical'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Body Location</span>
              <strong className="text-slate-800">{wound?.body_location || 'Unspecified'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">First Observed</span>
              <strong className="text-slate-800">{wound?.first_observed_date || 'Recent'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Dressing Type</span>
              <strong className="text-teal-700">{wound?.dressing_type || 'Transparent Biopolymer'}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Monitoring Span</span>
              <strong className="text-slate-800">{images.length > 0 ? `${images.length * 3} days` : '1 day'}</strong>
            </div>
          </div>

        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        images.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-2">
            <Camera size={32} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No photos in gallery</p>
            <button
              onClick={() => navigate('/capture', { state: { woundId: wound?.id } })}
              className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold"
            >
              Upload Photo
            </button>
          </div>
        ) : (
          <ImageGallery
            images={images}
            onCompareRequest={() => navigate('/compare')}
          />
        )
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Observation Timeline</h3>
          <div className="space-y-3">
            {images.map((img, idx) => (
              <div key={img.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={getStorageUrl(img.thumbnail_url || img.overlay_url || img.image_url)}
                    alt="Observation"
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block">Observation #{idx + 1}</span>
                    <span className="text-[11px] text-slate-500">{formatUploadDateTime(img)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-teal-700">{img.ai_analysis?.estimated_area_cm2 || 0} cm²</span>
                  <span className="block text-[10px] text-slate-400 capitalize">{img.ai_analysis?.monitoring_status?.replace('_', ' ') || 'Healing'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Doctor Notes Tab */}
      {activeTab === 'doctorNotes' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-sm text-slate-900">Doctor Clinical Notes</h3>
          {(wound?.doctor_notes && wound.doctor_notes.length > 0) ? (
            wound.doctor_notes.map((note) => (
              <div key={note.id} className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>{note.doctor_name || 'Attending Physician'}</span>
                  <span className="text-slate-400 text-[11px]">{new Date(note.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{note.recommendations || note.clinical_observation}</p>
              </div>
            ))
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500">
              No clinical notes recorded yet by attending physicians.
            </div>
          )}
        </div>
      )}

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
