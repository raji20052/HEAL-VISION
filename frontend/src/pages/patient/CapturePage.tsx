import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Camera, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { api, getStorageUrl } from '../../services/api';
import { WoundSummary } from '../../types';
import { AnalysisProgress } from '../../components/capture/AnalysisProgress';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const CapturePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [selectedWoundId, setSelectedWoundId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    api.wounds.list().then((list) => {
      setWounds(list);
      if (list.length > 0) {
        setSelectedWoundId(list[0].id);
      }
    }).catch(console.error);
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let targetWoundId = selectedWoundId;

      // If user has no wounds yet, create a primary wound automatically for them
      if (!targetWoundId) {
        const newWound = await api.wounds.create({
          name: 'My Primary Wound',
          wound_type: 'surgical',
          body_location: 'Lower leg',
          dressing_type: 'Transparent Biopolymer Film',
          first_observed_date: new Date().toISOString().split('T')[0],
          description: 'Self-monitored wound image series'
        });
        targetWoundId = newWound.id;
        setSelectedWoundId(newWound.id);
      }

      // Upload image to backend for real-time OpenCV analysis
      const uploadedImage = await api.images.upload(targetWoundId, selectedFile, {
        notes: 'User captured monitoring image'
      });

      // Navigate to analysis result with real analysis payload
      navigate('/analysis-result', {
        state: {
          image: uploadedImage,
          woundId: targetWoundId
        }
      });
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setIsAnalyzing(false);
      setErrorMessage(err.response?.data?.detail || 'Failed to process wound image. Please try again.');
    }
  };

  if (isAnalyzing) {
    return (
      <div className="py-12 max-w-xl mx-auto font-sans">
        <AnalysisProgress onComplete={() => {}} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Title */}
      <div className="space-y-0.5 border-b border-slate-200/80 pb-3">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Capture or Upload Wound Image
        </h2>
        <p className="text-xs text-slate-400">
          Upload your own real wound photo for real-time computer vision analysis.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Wound Selector if user has multiple wounds */}
      {wounds.length > 1 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between gap-4 text-xs">
          <label className="font-bold text-slate-700">Assign to Wound:</label>
          <select
            value={selectedWoundId}
            onChange={(e) => setSelectedWoundId(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-teal-500"
          >
            {wounds.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.body_location})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Main Upload Box (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {previewUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-4/3 max-h-80 w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
                <img
                  src={previewUrl}
                  alt="Wound Preview"
                  className="max-h-full max-w-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Choose Another
                </button>

                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-500/20 flex items-center gap-2"
                >
                  <span>Start AI Analysis</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 sm:p-14 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/50'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-400'
              }`}
            >
              <div className="space-y-4 max-w-xs mx-auto">
                <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <UploadCloud size={32} />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800">
                    Drag & drop image here
                  </p>
                  <p className="text-xs text-slate-400">or</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                >
                  Choose Image
                </button>

                <p className="text-[11px] text-slate-400">
                  JPG, PNG, WEBP up to 10MB
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Capture Tips Sidebar Card (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Capture Tips</h3>

          <ul className="space-y-2.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>Use good lighting</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>Keep the wound centered</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>Avoid glare and strong shadows</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>Maintain similar distance</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
              <span>Keep dressing visible</span>
            </li>
          </ul>

          {/* Reference Image Thumbnail */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">
              Reference Example:
            </span>
            <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200">
              <img
                src="/storage/images/sample_wound_day1.jpg"
                alt="Capture Reference"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&auto=format&fit=crop&q=80';
                }}
              />
            </div>
          </div>
        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
