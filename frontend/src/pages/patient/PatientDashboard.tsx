import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Camera, Plus, BarChart2, ArrowRight, 
  Calendar, Layers, CheckCircle2, AlertTriangle, Activity 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api, getStorageUrl } from '../../services/api';
import { WoundSummary } from '../../types';
import { AddWoundWizard } from '../../components/wound/AddWoundWizard';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [sharedDoctorsCount, setSharedDoctorsCount] = useState<number>(0);
  const [recentShares, setRecentShares] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddWizard, setShowAddWizard] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [woundsData, sharesData] = await Promise.all([
        api.wounds.list().catch(() => []),
        api.sharing.getMyShares().catch(() => [])
      ]);
      setWounds(woundsData);
      setSharedDoctorsCount(sharesData.length);
      setRecentShares(sharesData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalImages = wounds.reduce((acc, w) => acc + (w.image_count || 0), 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'healing_normally':
      case 'improving':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">Improving</span>;
      case 'needs_monitoring':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Needs Monitoring</span>;
      case 'possible_abnormal_change':
      case 'possible_abnormal':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Possible Abnormal</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-50 text-slate-600 border border-slate-200">No Data</span>;
    }
  };

  const getOverallMonitoringBadge = () => {
    if (wounds.length === 0) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
          No Active Wounds
        </span>
      );
    }
    const hasAbnormal = wounds.some(w => w.latest_status?.includes('abnormal'));
    if (hasAbnormal) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Possible Abnormal
        </span>
      );
    }
    const hasMonitoring = wounds.some(w => w.latest_status?.includes('needs_monitoring'));
    if (hasMonitoring) {
      return (
        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Needs Monitoring
        </span>
      );
    }
    return (
      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
        Improving
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Top Welcome Title */}
      <div className="space-y-0.5">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Good morning, {user?.full_name?.split(' ')[0] || 'Patient'} 👋
        </h2>
        <p className="text-xs text-slate-400">
          Here's your wound monitoring overview
        </p>
      </div>

      {/* 4 Summary KPI Cards in a row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Wounds */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Active Wounds
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {wounds.length}
          </div>
          <Link to="/wounds" className="text-[11px] text-teal-600 font-medium hover:underline">
            View all
          </Link>
        </div>

        {/* Card 2: Images Captured */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Images Captured
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {totalImages}
          </div>
          <Link to="/wounds" className="text-[11px] text-teal-600 font-medium hover:underline">
            View all images
          </Link>
        </div>

        {/* Card 3: Monitoring Status */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Monitoring Status
          </span>
          <div>
            {getOverallMonitoringBadge()}
          </div>
          <Link to="/progress" className="text-[11px] text-teal-600 font-medium hover:underline">
            View details
          </Link>
        </div>

        {/* Card 4: Doctor Shared */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between h-24">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Doctor Shared
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {sharedDoctorsCount}
          </div>
          <Link to="/doctors" className="text-[11px] text-teal-600 font-medium hover:underline">
            View doctors
          </Link>
        </div>

      </div>

      {/* My Active Wounds Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900">My Active Wounds</h3>
          <Link to="/wounds" className="text-xs font-bold text-teal-600 hover:underline">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading active wounds...</div>
        ) : wounds.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <Layers size={32} className="mx-auto text-slate-400" />
            <p className="font-bold text-sm text-slate-800">No Wounds Registered Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Register your first wound or upload a photograph to begin real-time computer vision tracking.
            </p>
            <button
              onClick={() => setShowAddWizard(true)}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={14} />
              <span>Add Your First Wound</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wounds.map((w, index) => (
              <div
                key={w.id}
                onClick={() => navigate(`/wounds/${w.id}`)}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
                    <img
                      src={w.thumbnail_url ? getStorageUrl(w.thumbnail_url) : index === 0 ? '/storage/images/sample_wound_day14.jpg' : '/storage/images/sample_wound_day7.jpg'}
                      alt={w.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=150&auto=format&fit=crop&q=80';
                      }}
                    />
                  </div>

                  <div className="space-y-0.5">
                    <h4 className="font-extrabold text-sm text-slate-900">{w.name}</h4>
                    <div className="text-[11px] text-slate-500 capitalize">{w.wound_type} wound</div>
                    <div className="text-[11px] text-slate-400">{w.body_location}</div>
                    <div className="text-[10px] text-slate-400">
                      Last update: {w.latest_image_date ? new Date(w.latest_image_date).toLocaleDateString() : 'Today'}
                    </div>
                    <div className="pt-1">
                      {getStatusBadge(w.latest_status)}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-semibold text-slate-500 block">Images</span>
                  <span className="text-xl font-bold text-slate-800 font-mono">{w.image_count || 1}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom 2-Column Section: Recent Activity (Left) & Quick Actions (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Recent Activity (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Recent Activity</h3>

          <div className="space-y-3 divide-y divide-slate-100 text-xs">
            
            <div className="flex items-center justify-between pt-2 first:pt-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span className="text-slate-400 text-[11px]">Session</span>
                <span className="font-semibold text-slate-800">
                  {wounds.length > 0 ? 'Real-time CV analysis active' : 'Account initialized & secure session active'}
                </span>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                Live
              </span>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${wounds.length > 0 ? 'bg-teal-600' : 'bg-slate-300'}`} />
                <span className="text-slate-400 text-[11px]">Wound Tracking</span>
                <span className="font-semibold text-slate-800">
                  {wounds.length > 0 ? `${wounds.length} active wound(s) under observation` : 'No wound images uploaded yet'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${sharedDoctorsCount > 0 ? 'bg-teal-600' : 'bg-slate-300'}`} />
                <span className="text-slate-400 text-[11px]">Telemedicine</span>
                <span className="font-semibold text-slate-800">
                  {sharedDoctorsCount > 0 
                    ? `${recentShares[0]?.doctor_name || 'Physician'} shared review enabled` 
                    : 'No doctors shared yet • Directory ready'}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Actions (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900">Quick Actions</h3>

          <div className="space-y-2">
            <Link
              to="/capture"
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Camera size={14} />
              <span>Capture New Image</span>
            </Link>

            <button
              onClick={() => setShowAddWizard(true)}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>Add Wound</span>
            </button>

            <Link
              to="/progress"
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <BarChart2 size={14} />
              <span>View Progress</span>
            </Link>
          </div>
        </div>

      </div>

      <MedicalDisclaimer compact={true} />

      <AddWoundWizard
        isOpen={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={() => fetchData()}
      />

    </div>
  );
};
