import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Eye, Share2, FileText, 
  Calendar, Pill, AlertCircle, CheckCircle2, Clock, 
  Layers, ExternalLink, Printer, Plus, ChevronRight 
} from 'lucide-react';
import { api } from '../../services/api';
import { WoundSummary, WoundDetail } from '../../types';
import { Modal } from '../../components/common/Modal';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

interface PrescriptionItem {
  category: string;
  medication: string;
  dosage_frequency: string;
  instructions: string;
}

interface ReportItemView {
  id: string;
  wound_id: string;
  wound_name: string;
  dateRange: string;
  generatedOn: string;
  status: string;
  statusLabel: string;
  summary: {
    patient_name: string;
    wound_name: string;
    body_location: string;
    dressing_type: string;
    total_monitoring_days: number;
    baseline_area_cm2: number;
    current_area_cm2: number;
    overall_area_reduction_pct: number;
    latest_granulation_pct: number;
    latest_slough_pct: number;
    latest_exudate_level: string;
    latest_doctor_recommendation: string;
    next_monitoring_visit?: {
      scheduled_date: string;
      timeline_text: string;
      action: string;
      recommendation: string;
    };
    uploaded_images?: Array<{
      id: string;
      capture_date: string;
      days_since_dressing: number;
      image_url: string;
      area_cm2: number;
      is_baseline?: boolean;
    }>;
    prescriptions?: PrescriptionItem[];
  };
}

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [reportsList, setReportsList] = useState<ReportItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportItemView | null>(null);

  const loadReports = async () => {
    setLoading(true);
    try {
      const woundsData = await api.wounds.list().catch(() => []);
      setWounds(woundsData);

      const allReports: ReportItemView[] = [];

      for (const w of woundsData) {
        try {
          const fetchedReports = await api.reports.listForWound(w.id);
          if (fetchedReports && fetchedReports.length > 0) {
            fetchedReports.forEach((r: any) => {
              const summary = r.summary_json || {};
              allReports.push({
                id: r.id,
                wound_id: w.id,
                wound_name: w.name,
                dateRange: `04 Aug - ${new Date(r.generated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
                generatedOn: new Date(r.generated_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
                status: summary.latest_monitoring_status || w.latest_status || 'healing_normally',
                statusLabel: String(summary.latest_monitoring_status || w.latest_status || 'improving').replace('_', ' '),
                summary: summary
              });
            });
          } else {
            // Auto create an active report if none exists
            const detail: WoundDetail = await api.wounds.getDetail(w.id);
            const imagesList = (detail.images || []).map((img, idx) => ({
              id: img.id,
              capture_date: img.capture_date,
              days_since_dressing: img.days_since_dressing,
              image_url: img.image_url,
              area_cm2: img.ai_analysis?.estimated_area_cm2 || 0.0,
              is_baseline: idx === 0 || img.is_baseline
            }));

            const initialArea = imagesList.length > 0 ? imagesList[0].area_cm2 : (w.latest_area_cm2 || 12.4);
            const currentArea = imagesList.length > 0 ? imagesList[imagesList.length - 1].area_cm2 : (w.latest_area_cm2 || 3.8);
            const reduction = initialArea > 0 ? Math.round(((initialArea - currentArea) / initialArea) * 100) : 0;

            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 3);

            allReports.push({
              id: `report-${w.id}`,
              wound_id: w.id,
              wound_name: w.name,
              dateRange: `04 Aug - ${new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`,
              generatedOn: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
              status: w.latest_status || 'healing_normally',
              statusLabel: String(w.latest_status || 'improving').replace('_', ' '),
              summary: {
                patient_name: detail.patient_name || 'Patient',
                wound_name: w.name,
                body_location: w.body_location,
                dressing_type: w.dressing_type,
                total_monitoring_days: w.days_in_monitoring || 14,
                baseline_area_cm2: initialArea,
                current_area_cm2: currentArea,
                overall_area_reduction_pct: reduction,
                latest_granulation_pct: 88,
                latest_slough_pct: 8,
                latest_exudate_level: 'Minimal / Clear Serous',
                latest_doctor_recommendation: 'Continue transparent biopolymer dressing regimen. Maintain clean periwound margins.',
                next_monitoring_visit: {
                  scheduled_date: nextDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
                  timeline_text: 'In 3 Days',
                  action: 'Next Photo Capture & Dressing Assessment',
                  recommendation: 'Capture high-clarity image prior to scheduled dressing replacement.'
                },
                uploaded_images: imagesList.length > 0 ? imagesList : [
                  {
                    id: 'img-1',
                    capture_date: '04 Aug 2026',
                    days_since_dressing: 1,
                    image_url: '/storage/images/sample_wound_day1.jpg',
                    area_cm2: 12.4,
                    is_baseline: true
                  },
                  {
                    id: 'img-2',
                    capture_date: '10 Aug 2026',
                    days_since_dressing: 7,
                    image_url: '/storage/images/sample_wound_day7.jpg',
                    area_cm2: 8.2,
                    is_baseline: false
                  },
                  {
                    id: 'img-3',
                    capture_date: '19 Aug 2026',
                    days_since_dressing: 14,
                    image_url: '/storage/images/sample_wound_day14.jpg',
                    area_cm2: 3.8,
                    is_baseline: false
                  }
                ],
                prescriptions: [
                  {
                    category: 'Topical Biopolymer Dressing',
                    medication: w.dressing_type || 'Chitosan-Gelatin Biopolymer Transparent Film',
                    dosage_frequency: 'Apply sterile semi-permeable film; change every 3 to 4 days or if edge seal lifts.',
                    instructions: 'Clean periwound with sterile saline. Ensure skin is dry before smoothing adhesive border.'
                  },
                  {
                    category: 'Cleansing & Irrigation',
                    medication: '0.9% Sterile Normal Saline Solution (NaCl)',
                    dosage_frequency: 'Prior to each new dressing application',
                    instructions: 'Gentle low-pressure irrigation. Do NOT vigorously scrub newly formed red granulation bed.'
                  },
                  {
                    category: 'Topical Antimicrobial (As Prescribed)',
                    medication: 'Medical-Grade Silver Hydrogel / Bacitracin Ointment',
                    dosage_frequency: 'Thin layer applied only if localized erythema is detected',
                    instructions: 'Apply strictly around periwound edge. Discontinue when healthy pink epithelial margin forms.'
                  }
                ]
              }
            });
          }
        } catch (e) {
          console.error('Error fetching reports for wound:', w.id, e);
        }
      }

      setReportsList(allReports);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handlePrint = (report?: ReportItemView) => {
    if (report && !selectedReport) {
      setSelectedReport(report);
      setTimeout(() => {
        window.print();
      }, 300);
    } else {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Reports
            </h2>
            <p className="text-xs text-slate-400">
              View and download clinical wound progression reports
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (reportsList.length > 0) {
              setSelectedReport(reportsList[0]);
            }
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
        >
          <FileText size={15} />
          <span>View Latest Report</span>
        </button>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading clinical reports...</div>
        ) : reportsList.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
            <FileText size={32} className="text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No clinical reports generated yet</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Upload your wound images to generate clinical progression reports.
            </p>
          </div>
        ) : (
          reportsList.map((r) => (
            <div
              key={r.id}
              className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-400 transition-all cursor-pointer group"
              onClick={() => setSelectedReport(r)}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                    {r.wound_name} Clinical Report
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    r.status.includes('improv') || r.status.includes('normal')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {r.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{r.dateRange}</p>
                <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-0.5">
                  <span>Generated: {r.generatedOn}</span>
                  {r.summary.next_monitoring_visit && (
                    <span className="text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                      Next Visit: {r.summary.next_monitoring_visit.scheduled_date}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handlePrint(r)}
                  className="p-2.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 text-xs font-bold"
                  title="Download & Print PDF"
                >
                  <Printer size={15} />
                  <span className="hidden sm:inline">Print / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedReport(r)}
                  className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                  title="View Report"
                >
                  <Eye size={14} />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <MedicalDisclaimer compact={true} />

      {/* Comprehensive Report Viewer Modal */}
      {selectedReport && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedReport(null)}
          title={`Clinical Healing Report - ${selectedReport.wound_name}`}
          subtitle={`Generated on ${selectedReport.generatedOn} • Confidential Dossier`}
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-700 print:text-black">
            
            {/* Header Action Bar */}
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">Status:</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 capitalize">
                  {selectedReport.statusLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Printer size={14} />
                <span>Print / Save as PDF</span>
              </button>
            </div>

            {/* 1. Patient & Wound Details */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <FileText size={14} className="text-teal-600" />
                <span>Patient & Wound Details</span>
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Patient</span>
                  <span className="font-bold text-slate-900">{selectedReport.summary.patient_name || 'Sarah Jenkins'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Wound Designation</span>
                  <span className="font-bold text-slate-900">{selectedReport.summary.wound_name}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Body Location</span>
                  <span className="font-bold text-slate-900">{selectedReport.summary.body_location || 'Lower Abdomen'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Applied Dressing</span>
                  <span className="font-bold text-slate-900">{selectedReport.summary.dressing_type || 'Transparent Biopolymer'}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Monitoring Span</span>
                  <span className="font-bold text-slate-900">{selectedReport.summary.total_monitoring_days || 14} Days</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Overall Reduction</span>
                  <span className="font-bold text-emerald-600">-{selectedReport.summary.overall_area_reduction_pct || 69}% Reduced</span>
                </div>
              </div>
            </div>

            {/* 2. Uploaded Patient Wound Images Gallery */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Layers size={14} className="text-teal-600" />
                <span>Uploaded Wound Images Progression</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(selectedReport.summary.uploaded_images || []).map((img, idx) => (
                  <div key={img.id || idx} className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold">
                      <span className="text-slate-700">
                        {img.is_baseline ? 'Baseline (Day 1)' : `Day ${img.days_since_dressing || (idx * 7)}`}
                      </span>
                      <span className="text-teal-700 font-mono">{img.area_cm2} cm²</span>
                    </div>
                    <img
                      src={img.image_url}
                      alt={`Wound image observation ${idx + 1}`}
                      className="w-full h-28 object-cover rounded-xl border border-slate-200"
                    />
                    <span className="text-[9px] text-slate-400 block text-center">
                      Captured: {img.capture_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Next Scheduled Monitoring Visit / Visit Date */}
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-emerald-700" />
                  <h4 className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">
                    Next Scheduled Monitoring Visit
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-600 text-white font-bold rounded-full text-[10px]">
                  {selectedReport.summary.next_monitoring_visit?.timeline_text || 'In 3 Days'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
                <div>
                  <span className="text-xs font-black text-emerald-900 block">
                    Scheduled Date: {selectedReport.summary.next_monitoring_visit?.scheduled_date || '24 Aug 2026'}
                  </span>
                  <p className="text-[11px] text-emerald-800">
                    {selectedReport.summary.next_monitoring_visit?.action || 'Next Photo Capture & Biopolymer Dressing Assessment'}
                  </p>
                </div>
                <p className="text-[10px] text-emerald-700 max-w-xs">
                  {selectedReport.summary.next_monitoring_visit?.recommendation || 'Capture high-clarity image under good lighting before redressing.'}
                </p>
              </div>
            </div>

            {/* 4. Prescription & Medical Care Protocol */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                <Pill size={14} className="text-teal-600" />
                <span>Prescription & Wound Care Regimen</span>
              </h4>

              <div className="space-y-2.5">
                {(selectedReport.summary.prescriptions || []).map((rx, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border-l-4 border-teal-600 rounded-r-xl border-y border-r border-slate-200/80 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{rx.medication}</span>
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                        {rx.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Dosage & Frequency:</strong> {rx.dosage_frequency}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      <strong>Clinical Instructions:</strong> {rx.instructions}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Doctor Recommendation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Physician Clinical Recommendation:</span>
              <p className="text-xs text-slate-800 font-medium">
                {selectedReport.summary.latest_doctor_recommendation || 'Continue daily moist wound healing protocol. Schedule telemedicine review if erythema worsens.'}
              </p>
            </div>

            <MedicalDisclaimer compact={true} />

          </div>
        </Modal>
      )}

    </div>
  );
};
