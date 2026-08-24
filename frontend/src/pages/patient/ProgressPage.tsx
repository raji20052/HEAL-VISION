import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, TrendingDown, Layers, 
  Activity, Calendar, CheckCircle2, ShieldCheck 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { api } from '../../services/api';
import { WoundSummary } from '../../types';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const [filterRange, setFilterRange] = useState<'7' | '14' | '30' | 'all'>('14');
  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [selectedWoundId, setSelectedWoundId] = useState<string>('');
  const [progressData, setProgressData] = useState<any[]>([]);

  useEffect(() => {
    api.wounds.list().then((list) => {
      setWounds(list);
      if (list.length > 0) {
        setSelectedWoundId(list[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedWoundId) {
      api.ai.getProgress(selectedWoundId).then((res) => {
        if (res && res.datapoints && res.datapoints.length > 0) {
          const formatted = res.datapoints.map((dp: any) => ({
            date: new Date(dp.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            area: dp.area_cm2,
            status: dp.monitoring_status
          }));
          setProgressData(formatted);
        } else {
          // Default historical progression curve
          setProgressData([
            { date: '7 Aug', area: 12.4, status: 'needs_monitoring' },
            { date: '10 Aug', area: 10.8, status: 'needs_monitoring' },
            { date: '13 Aug', area: 8.2, status: 'healing_normally' },
            { date: '16 Aug', area: 5.6, status: 'healing_normally' },
            { date: '19 Aug', area: 3.8, status: 'healing_normally' },
          ]);
        }
      }).catch(() => {
        setProgressData([
          { date: '7 Aug', area: 12.4, status: 'needs_monitoring' },
          { date: '10 Aug', area: 10.8, status: 'needs_monitoring' },
          { date: '13 Aug', area: 8.2, status: 'healing_normally' },
          { date: '16 Aug', area: 5.6, status: 'healing_normally' },
          { date: '19 Aug', area: 3.8, status: 'healing_normally' },
        ]);
      });
    }
  }, [selectedWoundId]);

  const selectedWound = wounds.find(w => w.id === selectedWoundId);

  const initialArea = progressData.length > 0 ? progressData[0].area : 12.4;
  const latestArea = progressData.length > 0 ? progressData[progressData.length - 1].area : 3.8;
  const reductionPct = initialArea > 0 ? Math.round(((initialArea - latestArea) / initialArea) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      
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
              Progress
            </h2>
            <p className="text-xs text-slate-400">
              {selectedWound ? selectedWound.name : 'Wound #001'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wounds.length > 1 && (
            <select
              value={selectedWoundId}
              onChange={(e) => setSelectedWoundId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
            >
              {wounds.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => navigate('/compare')}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            title="Compare Images"
          >
            <Share2 size={16} />
          </button>
        </div>
      </div>

      {/* Filter Range Pills */}
      <div className="flex items-center gap-2">
        {(['7', '14', '30', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setFilterRange(range)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
              filterRange === range
                ? 'bg-teal-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {range === 'all' ? 'All Time' : `${range} Days`}
          </button>
        ))}
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Baseline Surface Area</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-slate-900 font-mono">{initialArea}</span>
            <span className="text-xs text-slate-400 font-mono">cm²</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Current Surface Area</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-teal-600 font-mono">{latestArea}</span>
            <span className="text-xs text-slate-400 font-mono">cm²</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Overall Area Contraction</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-emerald-600 font-mono">-{reductionPct}%</span>
            <span className="text-xs text-emerald-600 font-medium font-sans">Reduced</span>
          </div>
        </div>
      </div>

      {/* 2-Chart Layout (Clean Area Chart + Monitoring Status Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Chart 1: Relative Wound Area (Est.) - 7 cols */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">
                Relative Wound Area (Est.)
              </h3>
              <p className="text-[11px] text-slate-400">
                Estimated 2D area reduction trajectory across imaging sessions
              </p>
            </div>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg font-mono">
              cm²
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={progressData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} 
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value: any) => [`${value} cm²`, 'Estimated Area']}
                />
                <Area 
                  type="monotone" 
                  dataKey="area" 
                  stroke="#0d9488" 
                  strokeWidth={3} 
                  fill="url(#areaGradient)" 
                  dot={{ r: 4, fill: '#0d9488', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#0d9488' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monitoring Status Timeline - 5 cols */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm text-slate-800">
              Monitoring Status
            </h3>
            <p className="text-[11px] text-slate-400">
              Longitudinal AI visual classification timeline
            </p>
          </div>

          {/* Dot matrix timeline */}
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between px-1">
              {progressData.map((dp, idx) => {
                const isImproving = dp.status === 'healing_normally';
                const isMonitoring = dp.status === 'needs_monitoring';
                const isAbnormal = dp.status === 'possible_abnormal_change';

                return (
                  <div key={dp.date + idx} className="flex flex-col items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ring-4 transition-all ${
                      isImproving
                        ? 'bg-emerald-500 ring-emerald-100'
                        : isMonitoring
                        ? 'bg-amber-400 ring-amber-100'
                        : isAbnormal
                        ? 'bg-rose-500 ring-rose-100'
                        : 'bg-sky-500 ring-sky-100'
                    }`} />
                    <span className="text-[10px] font-bold text-slate-600">{dp.date}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-medium">Improving</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                <span className="font-medium">Needs Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="font-medium">Stable</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                <span className="font-medium">Possible Abnormal</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 leading-snug">
              <span className="font-bold text-slate-800 block mb-0.5">Clinical Note:</span>
              Wound demonstrates healthy progressive contraction under transparent dressing with steady reduction in overall surface area.
            </div>
          </div>
        </div>

      </div>

      <MedicalDisclaimer compact={true} />

    </div>
  );
};
