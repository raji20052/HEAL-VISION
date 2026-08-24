import React, { useState, useRef, useCallback } from 'react';
import { WoundImage } from '../../types';
import { getStorageUrl } from '../../services/api';
import { Layers, Sliders, Calendar, TrendingDown, Eye } from 'lucide-react';

interface ImageCompareSliderProps {
  images: WoundImage[];
}

export const ImageCompareSlider: React.FC<ImageCompareSliderProps> = ({ images }) => {
  if (!images || images.length < 2) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">
        <Sliders className="mx-auto mb-2 text-slate-400" size={32} />
        <p className="text-sm font-medium">Capture at least 2 images across different days to unlock interactive comparison slider.</p>
      </div>
    );
  }

  // Baseline default is first image (Day 1) and Compare default is latest image
  const [beforeIdx, setBeforeIdx] = useState<number>(0);
  const [afterIdx, setAfterIdx] = useState<number>(images.length - 1);
  const [sliderPosition, setSliderPosition] = useState<number>(50); // percentage 0-100
  const [viewMode, setViewMode] = useState<'original' | 'overlay' | 'heatmap'>('original');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const beforeImg = images[beforeIdx];
  const afterImg = images[afterIdx];

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX);
    }
  };

  const getImageSrc = (img: WoundImage) => {
    if (viewMode === 'overlay' && img.overlay_url) return getStorageUrl(img.overlay_url);
    if (viewMode === 'heatmap' && img.heatmap_url) return getStorageUrl(img.heatmap_url);
    return getStorageUrl(img.image_url);
  };

  const beforeArea = beforeImg.ai_analysis?.estimated_area_cm2 || 0;
  const afterArea = afterImg.ai_analysis?.estimated_area_cm2 || 0;
  const areaDeltaPct = beforeArea > 0 ? roundOne(((beforeArea - afterArea) / beforeArea) * 100) : 0;

  function roundOne(val: number) {
    return Math.round(val * 10) / 10;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Sliders size={18} className="text-teal-600" />
            <span>Interactive Longitudinal Comparison</span>
          </h3>
          <p className="text-xs text-slate-500">Drag slider left/right to compare wound evolution through transparent dressing.</p>
        </div>

        {/* View Mode Layer Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl gap-1 text-xs">
          <button
            onClick={() => setViewMode('original')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'original' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original Photos
          </button>
          <button
            onClick={() => setViewMode('overlay')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'overlay' ? 'bg-white text-teal-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Wound Contours
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              viewMode === 'heatmap' ? 'bg-white text-cyan-700 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tissue Heatmap
          </button>
        </div>
      </div>

      {/* Selectors for Time Points */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">Before (Left Side):</span>
          <select
            value={beforeIdx}
            onChange={(e) => setBeforeIdx(Number(e.target.value))}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-800 focus:outline-teal-500"
          >
            {images.map((img, idx) => (
              <option key={img.id} value={idx}>
                Day {img.days_since_dressing} ({img.capture_date}) {img.is_baseline ? '★ Baseline' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">After (Right Side):</span>
          <select
            value={afterIdx}
            onChange={(e) => setAfterIdx(Number(e.target.value))}
            className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1 font-medium text-slate-800 focus:outline-teal-500"
          >
            {images.map((img, idx) => (
              <option key={img.id} value={idx}>
                Day {img.days_since_dressing} ({img.capture_date}) {idx === images.length - 1 ? '★ Latest' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Split Screen Slider Area */}
      <div
        ref={containerRef}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative h-80 sm:h-96 w-full rounded-2xl overflow-hidden select-none cursor-ew-resize bg-slate-950 shadow-inner border border-slate-800"
      >
        {/* 'After' Image (Bottom Layer, Right Side) */}
        <img
          src={getImageSrc(afterImg)}
          alt="After capture"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* 'Before' Image (Clipped Top Layer, Left Side) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={getImageSrc(beforeImg)}
            alt="Before capture"
            className="absolute inset-0 w-full h-full object-cover max-w-none"
            style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          />
        </div>

        {/* Divider Handle Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl z-20 flex items-center justify-center pointer-events-none"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="w-9 h-9 -ml-0.5 rounded-full bg-white shadow-lg border border-slate-300 flex items-center justify-center text-slate-700">
            <Sliders size={15} className="rotate-90 text-teal-600" />
          </div>
        </div>

        {/* Floating Labels on overlay */}
        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-semibold pointer-events-none">
          Day {beforeImg.days_since_dressing} ({beforeImg.capture_date})
        </div>
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-lg text-xs font-semibold pointer-events-none">
          Day {afterImg.days_since_dressing} ({afterImg.capture_date})
        </div>

        {/* Help hint */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md text-slate-300 px-3 py-1 rounded-full text-[11px] pointer-events-none">
          ⟵ Drag to compare Before & After ⟶
        </div>
      </div>

      {/* Delta Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Baseline Area</span>
          <span className="font-bold text-slate-800 text-sm">{beforeArea} cm²</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Current Area</span>
          <span className="font-bold text-slate-800 text-sm">{afterArea} cm²</span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Contraction Delta</span>
          <span className={`font-bold text-sm ${areaDeltaPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {areaDeltaPct >= 0 ? `-${areaDeltaPct}%` : `+${Math.abs(areaDeltaPct)}%`}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase text-slate-400 font-semibold block">Span Between Photos</span>
          <span className="font-bold text-slate-800 text-sm">
            {Math.abs(afterImg.days_since_dressing - beforeImg.days_since_dressing)} Days
          </span>
        </div>
      </div>

    </div>
  );
};
