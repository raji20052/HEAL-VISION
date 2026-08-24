import React, { useState, useRef } from 'react';
import { Upload, Camera, RefreshCw, Eye, CheckCircle2, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelected: (file: File, previewUrl: string) => void;
  selectedPreview?: string | null;
  onClear?: () => void;
  loading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  selectedPreview,
  onClear,
  loading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onImageSelected(file, previewUrl);
  };

  // Live Camera Stream
  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable on this device.');
      setCameraActive(false);
    }
  };

  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera_wound_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const previewUrl = URL.createObjectURL(blob);
            stopCamera();
            onImageSelected(file, previewUrl);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraActive(false);
  };

  return (
    <div className="space-y-4">
      
      {/* If Preview Exists */}
      {selectedPreview ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Wound Photo Ready for Analysis</span>
            </span>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="text-xs text-rose-600 font-bold hover:underline"
              >
                Retake / Choose Another
              </button>
            )}
          </div>

          <div className="relative aspect-4/3 max-h-80 w-full bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src={selectedPreview}
              alt="Wound Capture Preview"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      ) : cameraActive ? (
        /* Live Camera View */
        <div className="bg-slate-900 rounded-2xl p-4 space-y-3 text-white border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold flex items-center gap-2 text-teal-400">
              <Camera size={16} />
              <span>Live Camera Capture</span>
            </span>
            <button
              type="button"
              onClick={stopCamera}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel Camera
            </button>
          </div>

          <div className="relative aspect-4/3 max-h-80 w-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {/* Overlay guideline box */}
            <div className="absolute inset-8 rounded-xl border-2 border-teal-400/80 border-dashed pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-teal-200 font-bold bg-slate-950/60 px-2 py-0.5 rounded-full">
                Center wound under dressing
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={captureCameraPhoto}
            className="w-full py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/25"
          >
            <Camera size={16} />
            <span>Capture Photo</span>
          </button>
        </div>
      ) : (
        /* Drag & Drop Upload Container */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
              : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-teal-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="space-y-3 max-w-sm mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-xs border border-teal-100">
              <Upload size={26} />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                Upload Wound Image
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drag & drop image here, or <span className="text-teal-600 font-bold underline">browse files</span>
              </p>
            </div>

            <div className="text-[11px] text-slate-400">
              Supported Formats: JPG, PNG, WEBP (Up to 15MB)
            </div>

            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startCamera();
                }}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Camera size={14} className="text-teal-600" />
                <span>Use Device Camera</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optical Capture Quality Guidelines */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-2 text-slate-600">
        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
          Best Practices for Imaging Through Transparent Biopolymer Dressings:
        </span>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>Keep wound centered in frame</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>Use consistent, soft ambient lighting</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>Avoid specular glare on dressing film</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
            <span>Maintain 15-20 cm camera distance</span>
          </li>
        </ul>
      </div>

    </div>
  );
};
