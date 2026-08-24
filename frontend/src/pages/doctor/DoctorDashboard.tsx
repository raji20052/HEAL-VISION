import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const patientsList = [
    { name: 'John Doe', wound: 'Wound #001', update: '20 Aug 2026', status: 'improving', id: 'wound-001' },
    { name: 'Mary Smith', wound: 'Wound #003', update: '19 Aug 2026', status: 'needs_monitoring', id: 'wound-003' },
    { name: 'Robert Johnson', wound: 'Wound #002', update: '18 Aug 2026', status: 'stable', id: 'wound-002' },
    { name: 'Linda Brown', wound: 'Wound #004', update: '17 Aug 2026', status: 'possible_abnormal', id: 'wound-004' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">Improving</span>;
      case 'needs_monitoring':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Needs Monitoring</span>;
      case 'stable':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">Stable</span>;
      case 'possible_abnormal':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Possible Abnormal</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">Stable</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-sans">
      
      {/* Welcome Title */}
      <div className="space-y-0.5">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Welcome, Dr. Sarah
        </h2>
        <p className="text-xs text-slate-400">
          Here's your patient overview
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">Total Patients</span>
          <div className="text-2xl font-black text-slate-900 font-mono">12</div>
          <span className="text-[10px] text-slate-400">Active roster</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">Active Wounds</span>
          <div className="text-2xl font-black text-slate-900 font-mono">28</div>
          <span className="text-[10px] text-slate-400">Monitored sites</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">Needs Monitoring</span>
          <div className="text-2xl font-black text-amber-600 font-mono">5</div>
          <span className="text-[10px] text-amber-600">Action recommended</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">Pending Reviews</span>
          <div className="text-2xl font-black text-teal-700 font-mono">3</div>
          <span className="text-[10px] text-teal-600">Awaiting note</span>
        </div>

      </div>

      {/* Recent Patient Updates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">
          Recent Patient Updates
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 text-slate-400 font-bold text-[11px]">
              <tr>
                <th className="pb-3 px-3">Patient Name</th>
                <th className="pb-3 px-3">Wound</th>
                <th className="pb-3 px-3">Last Update</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {patientsList.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3 font-bold text-slate-900">{row.name}</td>
                  <td className="py-3 px-3 text-slate-600">{row.wound}</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">{row.update}</td>
                  <td className="py-3 px-3">{getStatusBadge(row.status)}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => navigate(`/doctor/review/${row.id}`)}
                      className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link to="/doctor/patients" className="text-xs font-bold text-teal-600 hover:underline">
            View All Patients
          </Link>
        </div>
      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
