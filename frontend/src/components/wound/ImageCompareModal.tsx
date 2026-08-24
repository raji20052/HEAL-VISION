import React, { useState } from 'react';
import { Sliders, Calendar, ArrowRight, Activity, TrendingDown, Eye } from 'lucide-react';
import { Modal } from '../common/Modal';
import { WoundImage } from '../../types';
import { getStorageUrl } from '../../services/api';

interface ImageCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: WoundImage[];
}

export const ImageCompareModal: React.FC<ImageCompareModalProps> = ({
  isOpen,
  onClose,
  images
}) => {
  if (!images || images.length < 2) return null;

  const [prevImgIdx, setPrevImgIdx] = useState(0);
  const [currImgIdx, setCurrImgIdx] = useState(images.length - 1);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'sideBySide'>('slider');

  const prevImage = images[prevImgIdx] || images[0];
  const currImage = images[currImgIdx] || images[images.length - 1];

  const prevArea = prevImage.ai_analysis?.estimated_area_cm2 || 0;
  const currArea = currImage.ai_analysis?.estimated_area_cm2 || 0;
  const deltaPct = prevArea > 0 ? Math.round(((currArea - prevArea) / prevArea) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Compare Longitudinal Wound Progression"
      subtitle="Interactive split-screen visual contraction analysis"
      maxWidth="4xl"
    >
      <div className="space-y-6 text-xs">
        
        {/* Timeline Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          
          {/* Left / Previous Image Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Left Reference Image:
            </label>
            <select
              value={prevImgIdx}
              onChange={(e) => setPrevImgIdx(Number(e.target.value))}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {images.map((img, idx) => (
                <option key={img.id} value={idx}>
                  Day {img.days_since_dressing} ({img.capture_date}) {img.is_baseline ? '• Baseline' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Right / Current Image Selector */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
              Right Follow-Up Image:
            </label>
            <select
              value={currImgIdx}
              onChange={(e) => setCurrImgIdx(Number(e.target.value))}
              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {images.map((img, idx) => (
                <option key={img.id} value={idx}>
                  Day {img.days_since_dressing} ({img.capture_date}) {idx === images.length - 1 ? '• Latest' : ''}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Comparison Display Canvas */}
        <div className="space-y-3">
          
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-xs">
              {viewMode === 'slider' ? 'Drag slider left/right to compare boundaries' : 'Side-by-side view'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'slider' ? 'sideBySide' : 'slider')}
                className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-50 transition-colors"
              >
                {viewMode === 'slider' ? 'Side-by-Side Mode' : 'Wipe Slider Mode'}
              </button>
            </div>
          </div>

          {viewMode === 'slider' ? (
            /* Split Screen Wipe Slider */
            <div className="relative aspect-16/9 max-h-[440px] w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner select-none border border-slate-800">
              
              {/* Previous Image (Background) */}
              <img
                src={getStorageUrl(prevImage.overlay_url || prevImage.image_url)}
                alt="Previous"
                className="absolute inset-0 w-full h-full object-contain"
              />
              <div className="absolute top-3 left-3 bg-slate-950/80 text-white px-2.5 py-1 rounded-full text-[10px] font-bold border border-white/10">
                Left: Day {prevImage.days_since_dressing} ({prevArea} cm²)
              </div>

              {/* Current Image (Foreground clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` }}
              >
                <img
                  src={getStorageUrl(currImage.overlay_url || currImage.image_url)}
                  alt="Current"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-teal-950/90 text-teal-300 px-2.5 py-1 rounded-full text-[10px] font-bold border border-teal-500/30">
                  Right: Day {currImage.days_since_dressing} ({currArea} cm²)
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
              />

              {/* Divider line & handle */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-20"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-0.5 h-full bg-white shadow-xl relative -translate-x-1/2">
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-teal-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg border-2 border-white">
                    ↔
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* Side by Side Mode */
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="relative aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={getStorageUrl(prevImage.overlay_url || prevImage.image_url)}
                    alt="Previous"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                    Day {prevImage.days_since_dressing}
                  </div>
                </div>
                <div className="text-center text-[11px] font-bold text-slate-700">
                  Area: {prevArea} cm²
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative aspect-4/3 bg-slate-950 rounded-2xl overflow-hidden border border-slate-200">
                  <img
                    src={getStorageUrl(currImage.overlay_url || currImage.image_url)}
                    alt="Current"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-teal-900/80 text-teal-300 px-2 py-0.5 rounded text-[10px] font-bold">
                    Day {currImage.days_since_dressing}
                  </div>
                </div>
                <div className="text-center text-[11px] font-bold text-slate-700">
                  Area: {currArea} cm²
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Visual Change Summary Card (Academic & Neutral Wording) */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Activity size={14} className="text-teal-600" />
              <span>Comparative Visual Feature Observation</span>
            </span>
            <span className={`font-mono font-bold text-xs ${deltaPct <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {deltaPct <= 0 ? `${deltaPct}% relative area change` : `+${deltaPct}% area increase`}
            </span>
          </div>

          <p className="text-slate-600 text-[11px] leading-relaxed">
            {deltaPct < -10
              ? 'Compared with the previous reference image, the visible wound region appears reduced with advancing boundary contraction.'
              : deltaPct > 10
              ? 'Compared with the previous reference image, the visible wound region boundary shows a mild outward expansion. Consider discussing this visual change with your attending healthcare professional.'
              : 'The wound boundary and tissue distribution remain stable compared with the previous image under the transparent dressing.'}
          </p>

          <div className="text-[10px] text-slate-400">
            Note: This is an image-based visual observation and not a medical diagnosis or treatment directive.
          </div>
        </div>

      </div>
    </Modal>
  );
};
