import React, { useState } from 'react';
import { Layers, Eye, Info, Sparkles, ZoomIn } from 'lucide-react';
import { WoundImage } from '../../types';
import { getStorageUrl } from '../../services/api';

interface MultiLayerViewerProps {
  image: WoundImage;
}

type VisualLayer = 'raw' | 'overlay' | 'heatmap' | 'mask';

export const MultiLayerViewer: React.FC<MultiLayerViewerProps> = ({ image }) => {
  const [activeLayer, setActiveLayer] = useState<VisualLayer>('overlay');

  const getCurrentImageUrl = (): string => {
    switch (activeLayer) {
      case 'raw':
        return getStorageUrl(image.image_url);
      case 'overlay':
        return image.overlay_url ? getStorageUrl(image.overlay_url) : getStorageUrl(image.image_url);
      case 'heatmap':
        return image.heatmap_url ? getStorageUrl(image.heatmap_url) : getStorageUrl(image.image_url);
      case 'mask':
        return image.mask_url ? getStorageUrl(image.mask_url) : getStorageUrl(image.image_url);
      default:
        return getStorageUrl(image.image_url);
    }
  };

  const layers: Array<{ id: VisualLayer; label: string; desc: string }> = [
    { id: 'raw', label: '1. Raw Clinical', desc: 'Native photo captured through transparent dressing' },
    { id: 'overlay', label: '2. Contour Overlay', desc: 'AI-segmented wound boundary & dressing contour' },
    { id: 'heatmap', label: '3. Tissue Heatmap', desc: '4-Color tissue spectrum classification' },
    { id: 'mask', label: '4. Binary Mask', desc: 'High-contrast mask for metric area calculation' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
      
      {/* Layer Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            <span>Multi-Layer Visual Diagnostics Canvas</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            Switch layers to inspect segmented boundaries and colorimetry under biopolymer film
          </p>
        </div>

        <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 self-start sm:self-auto">
          {image.image_width} × {image.image_height} px • {image.file_size_kb} KB
        </span>
      </div>

      {/* Layer Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100/80 rounded-2xl">
        {layers.map((l) => {
          const isSelected = activeLayer === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id)}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                isSelected
                  ? 'bg-teal-600 text-white shadow-sm ring-1 ring-teal-700/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {l.label}
            </button>
          );
        })}
      </div>

      {/* Main Canvas Display Screen */}
      <div className="relative aspect-4/3 max-h-[420px] w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
        <img
          key={getCurrentImageUrl()}
          src={getCurrentImageUrl()}
          alt={`Layer: ${activeLayer}`}
          className="max-h-full max-w-full object-contain transition-opacity duration-200"
          onError={(e) => {
            // Fallback to placeholder if backend URL path is loading
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Floating Active Layer Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold border border-white/10 flex items-center gap-1.5">
          <Sparkles size={12} className="text-teal-400" />
          <span className="capitalize">{activeLayer} Layer</span>
        </div>

        {/* Capture Date Tag */}
        <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full text-[10px] font-mono border border-white/10">
          Capture: {image.capture_date} (Day {image.days_since_dressing})
        </div>
      </div>

      {/* Layer Description & Heatmap Color Legend */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <p className="text-xs text-slate-500 italic">
          {layers.find((l) => l.id === activeLayer)?.desc}
        </p>

        {activeLayer === 'heatmap' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="flex items-center gap-1.5 bg-rose-50 p-2 rounded-xl border border-rose-100">
              <div className="w-3 h-3 rounded-full bg-rose-500 shrink-0" />
              <span className="text-rose-900 font-bold">Granulation (Red/Pink)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-50 p-2 rounded-xl border border-amber-100">
              <div className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
              <span className="text-amber-900 font-bold">Slough / Fibrin (Yellow)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200">
              <div className="w-3 h-3 rounded-full bg-slate-900 shrink-0" />
              <span className="text-slate-900 font-bold">Necrotic Eschar (Dark)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-cyan-50 p-2 rounded-xl border border-cyan-100">
              <div className="w-3 h-3 rounded-full bg-cyan-200 shrink-0" />
              <span className="text-cyan-900 font-bold">Epithelial Margin (Pale)</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
