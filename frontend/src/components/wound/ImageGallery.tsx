import React, { useState } from 'react';
import { Calendar, Clock, Eye, Trash2, Sliders, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { WoundImage } from '../../types';
import { getStorageUrl } from '../../services/api';
import { StatusBadge } from '../common/StatusBadge';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface ImageGalleryProps {
  images: WoundImage[];
  onCompareRequest?: () => void;
  onDeleteImage?: (imageId: string) => Promise<void>;
  onSelectImage?: (image: WoundImage) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onCompareRequest,
  onDeleteImage,
  onSelectImage
}) => {
  const [selectedImageForView, setSelectedImageForView] = useState<WoundImage | null>(null);
  const [imageToDelete, setImageToDelete] = useState<WoundImage | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDeleteConfirm = async () => {
    if (!imageToDelete || !onDeleteImage) return;
    setDeleting(true);
    try {
      await onDeleteImage(imageToDelete.id);
      setImageToDelete(null);
      if (selectedImageForView?.id === imageToDelete.id) {
        setSelectedImageForView(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Helper to format both Date and Time
  const formatUploadDateTime = (img: WoundImage) => {
    const raw = img.created_at || img.capture_date;
    if (!raw) return { date: 'Today', time: '' };
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) {
        return { date: img.capture_date || 'Today', time: '' };
      }
      return {
        date: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
      };
    } catch {
      return { date: img.capture_date || 'Today', time: '' };
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-sm text-slate-900">Historical Image Timeline</h3>
          <p className="text-[11px] text-slate-400">
            Chronological photographic records captured through transparent dressing ({images.length} photos)
          </p>
        </div>

        {images.length >= 2 && onCompareRequest && (
          <button
            type="button"
            onClick={onCompareRequest}
            className="px-3.5 py-1.5 bg-slate-900 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Sliders size={13} />
            <span>Compare Progression</span>
          </button>
        )}
      </div>

      {/* Gallery Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img, idx) => {
          const status = img.ai_analysis?.monitoring_status || 'healing_normally';
          const area = img.ai_analysis?.estimated_area_cm2 || 0;
          const { date, time } = formatUploadDateTime(img);

          return (
            <div
              key={img.id}
              onClick={() => {
                setSelectedImageForView(img);
                onSelectImage?.(img);
              }}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md hover:border-teal-500/50 transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-4/3 bg-slate-950 flex items-center justify-center overflow-hidden">
                <img
                  src={getStorageUrl(img.thumbnail_url || img.overlay_url || img.image_url)}
                  alt={`Observation ${idx + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Day Badge */}
                <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
                  Photo #{idx + 1}
                </div>

                {img.is_baseline && (
                  <div className="absolute top-2 right-2 bg-teal-600 text-white px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider">
                    Baseline
                  </div>
                )}
              </div>

              {/* Card Meta Footer with BOTH Date & Time */}
              <div className="p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-1">
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                      {date}
                    </span>
                    {time && (
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={10} className="text-slate-400 shrink-0" />
                        <span>{time}</span>
                      </span>
                    )}
                  </div>
                  <StatusBadge status={status} size="sm" showIcon={false} />
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100 font-semibold text-slate-700">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Wound Area:</span>
                  <span className="font-mono text-slate-900 font-bold">{area} cm²</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Detail Modal */}
      {selectedImageForView && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedImageForView(null)}
          title={`Photographic Observation Record`}
          subtitle={`Uploaded on ${formatUploadDateTime(selectedImageForView).date} at ${formatUploadDateTime(selectedImageForView).time || 'N/A'}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            <div className="relative aspect-4/3 max-h-96 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800">
              <img
                src={getStorageUrl(selectedImageForView.overlay_url || selectedImageForView.image_url)}
                alt="Wound Record"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Status</span>
                <StatusBadge status={selectedImageForView.ai_analysis?.monitoring_status || 'healing_normally'} size="sm" />
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Est. Area</span>
                <strong className="text-slate-800 font-mono text-sm">{selectedImageForView.ai_analysis?.estimated_area_cm2 || 0} cm²</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Granulation</span>
                <strong className="text-rose-700 font-mono text-sm">{selectedImageForView.ai_analysis?.color_granulation_pct || 0}%</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Optical Quality</span>
                <strong className="text-slate-800 text-sm">{selectedImageForView.ai_analysis?.image_quality_status || 'PASS'}</strong>
              </div>
            </div>

            {selectedImageForView.notes && (
              <div className="p-3 bg-slate-50 rounded-xl text-slate-600">
                <span className="font-bold text-slate-800 block text-[11px]">Capture Notes:</span>
                <p className="mt-0.5">{selectedImageForView.notes}</p>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {onDeleteImage && !selectedImageForView.is_baseline && (
                <button
                  type="button"
                  onClick={() => setImageToDelete(selectedImageForView)}
                  className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>Delete Image</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedImageForView(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold ml-auto"
              >
                Close View
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Dialog */}
      {imageToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setImageToDelete(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete Wound Photograph"
          message={`Are you sure you want to delete the photograph recorded on ${formatUploadDateTime(imageToDelete).date} (${formatUploadDateTime(imageToDelete).time})? This action cannot be undone.`}
          confirmText="Yes, Delete Photo"
          isDestructive={true}
          loading={deleting}
        />
      )}

    </div>
  );
};
