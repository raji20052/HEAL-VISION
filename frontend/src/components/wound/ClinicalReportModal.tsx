import React, { useState } from 'react';
import { X, FileText, Printer, Download, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { WoundDetail, ReportItem } from '../../types';

interface ClinicalReportModalProps {
  wound: WoundDetail;
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  wound,
  isOpen,
  onClose
}) => {
  const [reportTitle, setReportTitle] = useState(`Clinical Healing Summary - ${wound.name}`);
  const [generatedReport, setGeneratedReport] = useState<ReportItem | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const rep = await api.reports.generate({
        wound_id: wound.id,
        title: reportTitle
      });
      setGeneratedReport(rep);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate clinical report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!generatedReport?.html_content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generatedReport.html_content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="space-y-1 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
              <FileText size={18} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Generate Clinical Summary Report</h2>
          </div>
          <p className="text-xs text-slate-500">
            Creates an exportable, printable medical document aggregating patient metrics, AI computer vision observations, and doctor assessments.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!generatedReport ? (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:bg-white focus:outline-teal-500"
              />
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Report Includes:</h4>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
                <li>Patient demographics & wound etiology</li>
                <li>Biopolymer dressing specifications</li>
                <li>Longitudinal surface area contraction rate & velocity</li>
                <li>Tissue colorimetry breakdown (Granulation / Slough / Necrotic)</li>
                <li>Fluid / exudate accumulation visual index</li>
                <li>Attending physician clinical observations & recommendations</li>
                <li>Full research & medical disclaimers</li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-2 shadow-sm"
              >
                <Sparkles size={15} />
                <span>{loading ? 'Compiling Report...' : 'Compile Clinical Report'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 space-y-1">
              <h4 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                <span>Clinical Report Compiled Successfully</span>
              </h4>
              <p className="text-emerald-700 text-xs">
                Report generated on {new Date(generatedReport.generated_at).toLocaleString()}. Ready for printing or export.
              </p>
            </div>

            {/* Preview Box */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner max-h-72 overflow-y-auto p-4 bg-slate-50 text-slate-700 font-sans">
              <div dangerouslySetInnerHTML={{ __html: generatedReport.html_content || '' }} />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setGeneratedReport(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Configure New Title
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={handlePrint}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 shadow-sm"
                >
                  <Printer size={15} />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
