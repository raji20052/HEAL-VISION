import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, Upload, RefreshCw, CheckCircle2, 
  AlertCircle, Sparkles, ShieldAlert, Sliders, Info, Eye 
} from 'lucide-react';
import { api } from '../../services/api';
import { WoundSummary } from '../../types';

interface CameraCaptureModalProps {
  wound: WoundSummary;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (analyzedImageRes: any) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  wound,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [useCamera, setUseCamera] = useState<boolean>(true);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedImageBlob, setCapturedImageBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [painScore, setPainScore] = useState<number>(2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [daysSinceDressing, setDaysSinceDressing] = useState<number>(wound.days_in_monitoring + 1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const symptomsOptions = [
    { id: 'redness', label: 'Periwound Redness / Erythema' },
    { id: 'warmth', label: 'Local Warmth' },
    { id: 'itching', label: 'Mild Itching' },
    { id: 'swelling', label: 'Swelling / Edema' },
    { id: 'pain', label: 'Throbbing / Soreness' },
    { id: 'odor', label: 'Noticeable Odor' },
  ];

  // Initialize camera
  useEffect(() => {
    if (isOpen && useCamera && !capturedImageBlob) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera, capturedImageBlob]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access error or unsupported:', err);
      setCameraError('Camera access unavailable or declined. You can upload an existing image file instead.');
      setUseCamera(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  if (!isOpen) return null;

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (blob) {
        setCapturedImageBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCapturedImageBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
      stopCamera();
    }
  };

  const handleRetake = () => {
    setCapturedImageBlob(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (useCamera) {
      startCamera();
    }
  };

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmitAnalysis = async () => {
    if (!capturedImageBlob) {
      setError('Please capture or select an image before submitting.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('wound_id', wound.id);
      formData.append('days_since_dressing', String(daysSinceDressing));
      formData.append('pain_score', String(painScore));
      formData.append('symptoms', selectedSymptoms.join(','));
      formData.append('notes', notes);
      formData.append('file', capturedImageBlob, 'capture.jpg');

      const result = await api.images.upload(formData);
      onSuccess(result);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to process wound image. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors z-20"
        >
          <X size={20} />
        </button>

        <div className="space-y-1 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <Camera size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Capture Wound Image</h2>
          </div>
          <p className="text-xs text-slate-500">
            Monitoring <strong className="text-slate-800">{wound.name}</strong> through transparent dressing: 
            <span className="text-teal-700 font-medium ml-1">({wound.dressing_type})</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Capture / Preview Viewport */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 h-72 sm:h-80 flex items-center justify-center shadow-inner">
          
          {previewUrl ? (
            // Preview of Captured Photo
            <img
              src={previewUrl}
              alt="Wound Capture Preview"
              className="w-full h-full object-contain"
            />
          ) : useCamera ? (
            // Live Video Feed with On-screen Alignment Frame
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* On-Screen Oval Alignment Guide */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 sm:w-64 h-40 sm:h-48 rounded-[50%] border-2 border-teal-400/80 shadow-[0_0_0_9999px_rgba(15,23,42,0.55)] ai-focus-ring flex items-center justify-center">
                  <div className="text-center text-[10px] text-teal-200 font-semibold bg-slate-900/80 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    Position Wound & Dressing Inside Oval
                  </div>
                </div>
              </div>

              {/* Live Guidance Banner */}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-between pointer-events-none">
                <span>💡 Keep camera steady under good lighting</span>
                <span className="text-teal-400 font-medium">Auto-Focus Ready</span>
              </div>
            </>
          ) : (
            // File Upload Area
            <div className="p-8 text-center text-slate-400 space-y-3">
              <Upload size={36} className="mx-auto text-slate-500" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Select wound photo from device</p>
                <p className="text-[11px] text-slate-400">JPG, PNG, WebP supported</p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-colors shadow-xs"
              >
                Choose Photo
              </button>
            </div>
          )}

          {/* Hidden Canvas & File Input */}
          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {/* Viewport Action Controls */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!previewUrl && (
              <button
                type="button"
                onClick={() => setUseCamera(!useCamera)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                {useCamera ? <Upload size={14} /> : <Camera size={14} />}
                <span>{useCamera ? 'Switch to File Upload' : 'Use Live Camera'}</span>
              </button>
            )}
          </div>

          <div>
            {!previewUrl ? (
              useCamera && (
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/25 flex items-center gap-1.5"
                >
                  <Camera size={15} />
                  <span>Snap Photo</span>
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={handleRetake}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw size={13} />
                <span>Retake Photo</span>
              </button>
            )}
          </div>
        </div>

        {/* Patient Symptoms & Pain Checklist */}
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3.5 text-xs">
          
          {/* Days under dressing */}
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <span className="font-semibold text-slate-700">Days Since Dressing Applied:</span>
            <input
              type="number"
              min={1}
              max={180}
              value={daysSinceDressing}
              onChange={(e) => setDaysSinceDressing(Number(e.target.value))}
              className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800"
            />
          </div>

          {/* Pain Scale (0-10) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Pain Score (0 to 10):
              </label>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                painScore >= 7 ? 'bg-rose-100 text-rose-800' : painScore >= 4 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {painScore} / 10 ({painScore === 0 ? 'No Pain' : painScore <= 3 ? 'Mild' : painScore <= 6 ? 'Moderate' : 'Severe'})
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={painScore}
              onChange={(e) => setPainScore(Number(e.target.value))}
              className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Observed Symptoms (Optional):
            </label>
            <div className="grid grid-cols-2 gap-2">
              {symptomsOptions.map(sym => (
                <label
                  key={sym.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer transition-all ${
                    selectedSymptoms.includes(sym.id)
                      ? 'border-teal-500 bg-teal-50/50 text-teal-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSymptoms.includes(sym.id)}
                    onChange={() => toggleSymptom(sym.id)}
                    className="text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span>{sym.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Patient Notes */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Patient Observations / Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Dressing feels intact, slight itchiness near border."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-teal-500"
            />
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={!capturedImageBlob || isSubmitting}
            onClick={handleSubmitAnalysis}
            className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-md shadow-teal-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles size={16} />
            <span>{isSubmitting ? 'Analyzing with AI...' : 'Analyze Wound Image'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
