import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, Search, Filter, ArrowRight, 
  Layers, Clock, CheckCircle2, AlertCircle, AlertTriangle 
} from 'lucide-react';
import { DoctorPatientItem } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface PatientTriageTableProps {
  patients: DoctorPatientItem[];
  loading?: boolean;
}

export const PatientTriageTable: React.FC<PatientTriageTableProps> = ({
  patients,
  loading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = patients.filter((p) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      p.patient_name.toLowerCase().includes(query) ||
      p.wound_name.toLowerCase().includes(query) ||
      p.body_location.toLowerCase().includes(query) ||
      p.dressing_type.toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === 'all' || p.latest_status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
      
      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient, wound name, or location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Filter Priority:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-teal-500"
          >
            <option value="all">All Shared Wounds ({patients.length})</option>
            <option value="possible_abnormal_change">🔴 Abnormal Change Alerts</option>
            <option value="needs_monitoring">🟡 Needs Monitoring</option>
            <option value="healing_normally">🟢 Healing Normally</option>
          </select>
        </div>

      </div>

      {/* Patient Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading assigned patient records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          No patient wound cases found matching your search or filter criteria.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Patient Name</th>
                <th className="py-3 px-4">Wound & Location</th>
                <th className="py-3 px-4">Biopolymer Dressing</th>
                <th className="py-3 px-4">AI Assessment</th>
                <th className="py-3 px-4">Est. Area</th>
                <th className="py-3 px-4">Review Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((p) => (
                <tr key={p.wound_id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Patient */}
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <div>{p.patient_name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{p.patient_email}</div>
                  </td>

                  {/* Wound */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800">{p.wound_name}</div>
                    <div className="text-[11px] text-slate-500">{p.body_location} ({p.wound_type})</div>
                  </td>

                  {/* Dressing */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-md font-medium border border-teal-100">
                      <Layers size={11} />
                      <span className="truncate max-w-[130px]">{p.dressing_type}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <StatusBadge status={p.latest_status} size="sm" />
                  </td>

                  {/* Area */}
                  <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">
                    {p.latest_area_cm2 > 0 ? `${p.latest_area_cm2} cm²` : 'N/A'}
                  </td>

                  {/* Doctor Review */}
                  <td className="py-3.5 px-4">
                    {p.pending_review ? (
                      <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200 text-[11px]">
                        <Clock size={11} />
                        <span>Pending Review</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200 text-[11px]">
                        <CheckCircle2 size={11} />
                        <span>Reviewed</span>
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/doctor/review/${p.wound_id}`}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-1 text-[11px]"
                    >
                      <span>Examine</span>
                      <ArrowRight size={13} />
                    </Link>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
