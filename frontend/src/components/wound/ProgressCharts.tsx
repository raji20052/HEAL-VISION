import React from 'react';
import { 
  ResponsiveContainer, LineChart, Line, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';
import { TemporalProgress } from '../../types';
import { TrendingDown, Activity, Layers } from 'lucide-react';

interface ProgressChartsProps {
  progress?: TemporalProgress;
}

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ progress }) => {
  if (!progress || !progress.datapoints || progress.datapoints.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
        No longitudinal data points available for charting.
      </div>
    );
  }

  // Format dataset for recharts
  const chartData = progress.datapoints.map((item) => ({
    day: `Day ${item.day_number}`,
    area: item.area_cm2,
    granulation: item.granulation_pct,
    slough: item.slough_pct,
  }));

  const baselineArea = progress.datapoints[0]?.area_cm2 || 0;
  const latestArea = progress.datapoints[progress.datapoints.length - 1]?.area_cm2 || 0;

  return (
    <div className="space-y-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Baseline Area
          </span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">
            {baselineArea} cm²
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Latest Area
          </span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">
            {latestArea} cm²
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Area Contraction
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingDown size={18} className={progress.overall_area_change_pct >= 0 ? "text-emerald-500" : "text-rose-500"} />
            <span className={`text-xl font-bold ${progress.overall_area_change_pct >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {progress.overall_area_change_pct > 0 ? `-${progress.overall_area_change_pct}%` : `${progress.overall_area_change_pct}%`}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Healing Velocity
          </span>
          <span className="text-xl font-bold text-teal-700 mt-1 block">
            {progress.healing_velocity_cm2_per_day} <span className="text-xs text-slate-500 font-normal">cm²/day</span>
          </span>
        </div>
      </div>

      {/* Trajectory Assessment Banner */}
      <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium flex items-center gap-2">
        <Activity size={16} className="text-teal-600 shrink-0" />
        <span>{progress.overall_trajectory_assessment}</span>
      </div>

      {/* Area Contraction Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <TrendingDown size={16} className="text-teal-600" />
            <span>Wound Surface Area Contraction Curve (cm²)</span>
          </h4>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
                formatter={(value: any) => [`${value} cm²`, 'Estimated Area']}
              />
              <Line 
                type="monotone" 
                dataKey="area" 
                stroke="#0d9488" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#0d9488', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tissue Transition Stacked Area Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers size={16} className="text-teal-600" />
            <span>Tissue Transition Over Time (% Granulation vs Slough)</span>
          </h4>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={[0, 100]} unit="%" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Area 
                type="monotone" 
                dataKey="granulation" 
                name="Granulation (Healthy Red)" 
                stroke="#f43f5e" 
                fill="#f43f5e" 
                fillOpacity={0.4} 
              />
              <Area 
                type="monotone" 
                dataKey="slough" 
                name="Slough / Fibrin (Yellow)" 
                stroke="#f59e0b" 
                fill="#f59e0b" 
                fillOpacity={0.4} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
