import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, RefreshCw, Stethoscope } from 'lucide-react';
import { api } from '../../services/api';
import { DoctorPatientItem } from '../../types';
import { PatientTriageTable } from '../../components/doctor/PatientTriageTable';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const DoctorPatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<DoctorPatientItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const data = await api.doctor.getPatients();
      setPatients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Assigned Patient Roster
          </h2>
          <p className="text-xs text-slate-500">
            Active patient cases sharing longitudinal wound healing telemetry with your clinical account.
          </p>
        </div>

        <button
          onClick={fetchPatients}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-bold self-start sm:self-auto"
        >
          <RefreshCw size={14} />
          <span>Refresh Roster</span>
        </button>
      </div>

      <PatientTriageTable patients={patients} loading={loading} />

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
