import React, { useState } from 'react';
import { WoundImage } from '../../types';
import { getStorageUrl } from '../../services/api';
import { 
  Layers, ZoomIn, ZoomOut, RotateCcw, 
  Sparkles, Eye, ShieldCheck, AlertCircle 
} from 'lucide-react';

interface MultiLayerImageViewerProps {
  image: WoundImage;
}

export const MultiLayerImageViewer: React.FC<MultiLayerImageViewerProps> = ({ image }) => {
  const [activeLayer, setActiveLayer] = useState<'original' | 'overlay' | 'heatmap' | 'mask'>('overlay');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const getActiveImageUrl = () => {
    switch (activeLayer) {
      case 'overlay':
        return image.overlay_url ? getStorageUrl(image.overlay_url) : getStorageUrl(image.image_url);
      case 'heatmap':
        return image.heatmap_url ? getStorageUrl(image.heatmap_url) : getStorageUrl(image.image_url);
      case 'mask':
        return image.mask_url ? getStorageUrl(image.mask_url) : getStorageUrl(image.image_url);
      case 'original':
      default:
        return getStorageUrl(image.image_url);
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => setZoomLevel(1);

  const analysis = image.ai_analysis;
  const quality = analysis?.quality_metrics;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      
      {/* Header with Layer Switchers */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">Multi-Layer Visual Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Captured on {image.capture_date} (Day {image.days_since_dressing} under dressing)
          </p>
        </div>

        {/* Layer Buttons */}
        <div className="flex items-center flex-wrap bg-slate-100 p-1 rounded-xl gap-1 text-xs">
          <button
            onClick={() => setActiveLayer('original')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeLayer === 'original' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. Original Photo
          </button>
          <button
            onClick={() => setActiveLayer('overlay')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeLayer === 'overlay' ? 'bg-teal-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. Wound Contour Overlay
          </button>
          <button
            onClick={() => setActiveLayer('heatmap')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeLayer === 'heatmap' ? 'bg-cyan-600 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. Tissue Color Heatmap
          </button>
          <button
            onClick={() => setActiveLayer('mask')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeLayer === 'mask' ? 'bg-slate-800 text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            4. Binary Mask
          </button>
        </div>
      </div>

      {/* Image Viewport */}
      <div className="relative h-80 sm:h-[420px] w-full bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
        
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <img
            src={getActiveImageUrl()}
            alt={`Wound layer ${activeLayer}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Zoom Controls Overlay bottom right */}
        <div className="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 text-white shadow-lg">
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-mono font-semibold px-1 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors border-l border-slate-700 pl-2"
            title="Reset Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Layer Badge Overlay top left */}
        <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 text-white px-3 py-1 rounded-lg text-xs font-semibold">
          Active Layer: <span className="text-teal-400 capitalize">{activeLayer}</span>
        </div>
      </div>

      {/* Heatmap Legend (when heatmap is selected) */}
      {activeLayer === 'heatmap' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Tissue Colorimetry Segmentation Legend:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-rose-500 shrink-0 ring-1 ring-black/10" />
              <span className="text-slate-700">Granulation (Healthy Vascular Red)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 shrink-0 ring-1 ring-black/10" />
              <span className="text-slate-700">Slough (Fibrinous Yellow)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-slate-900 shrink-0 ring-1 ring-black/10" />
              <span className="text-slate-700">Necrotic (Dark/Eschar)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-cyan-200 shrink-0 ring-1 ring-black/10" />
              <span className="text-slate-700">Epithelial (Advancing Skin Edge)</span>
            </div>
          </div>
        </div>
      )}

      {/* Quality Diagnostics Bar */}
      {quality && (
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className={image.image_quality_score >= 80 ? "text-emerald-600" : "text-amber-500"} />
            <span className="font-semibold text-slate-700">Optical Quality Score:</span>
            <span className="font-bold text-slate-900">{image.image_quality_score}%</span>
          </div>

          <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
            {quality.blur_score && <span>Sharpness: {quality.blur_score}</span>}
            {quality.brightness && <span>Luminance: {quality.brightness}</span>}
            {quality.glare_ratio_pct !== undefined && <span>Dressing Glare: {quality.glare_ratio_pct}%</span>}
          </div>
        </div>
      )}

    </div>
  );
};
