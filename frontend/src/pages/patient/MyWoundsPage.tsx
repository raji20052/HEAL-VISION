import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCw, Layers } from 'lucide-react';
import { api } from '../../services/api';
import { WoundSummary } from '../../types';
import { WoundCard } from '../../components/wound/WoundCard';
import { AddWoundWizard } from '../../components/wound/AddWoundWizard';
import { MedicalDisclaimer } from '../../components/common/MedicalDisclaimer';

export const MyWoundsPage: React.FC = () => {
  const [wounds, setWounds] = useState<WoundSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddWizard, setShowAddWizard] = useState(false);

  const fetchWounds = async () => {
    setLoading(true);
    try {
      const data = await api.wounds.list();
      setWounds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWounds();
  }, []);

  const filtered = wounds.filter((w) => {
    const query = searchQuery.toLowerCase();
    const matchesQuery = (
      w.name.toLowerCase().includes(query) ||
      w.body_location.toLowerCase().includes(query) ||
      w.dressing_type.toLowerCase().includes(query)
    );
    const matchesStatus = statusFilter === 'all' || w.latest_status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Monitored Wounds Directory
          </h2>
          <p className="text-xs text-slate-500">
            All registered surgical incisions, ulcers, and wound sites tracked under transparent dressings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWounds}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={14} />
          </button>

          <button
            onClick={() => setShowAddWizard(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Add New Wound</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by wound name, location, dressing..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:bg-white focus:outline-teal-500"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-slate-400" />
          <span className="text-slate-500 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800 text-xs focus:outline-teal-500"
          >
            <option value="all">All Statuses ({wounds.length})</option>
            <option value="healing_normally">🟢 Improving / Healing Normally</option>
            <option value="needs_monitoring">🟡 Needs Monitoring</option>
            <option value="possible_abnormal_change">🔴 Possible Abnormal Change</option>
          </select>
        </div>
      </div>

      {/* Wounds Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading wound profiles...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center space-y-3">
          <Layers size={32} className="mx-auto text-slate-400" />
          <p className="font-bold text-sm text-slate-800">No Wounds Found</p>
          <p className="text-xs text-slate-500">No active wound cases match your selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((w) => (
            <WoundCard key={w.id} wound={w} />
          ))}
        </div>
      )}

      <MedicalDisclaimer compact={true} />

      <AddWoundWizard
        isOpen={showAddWizard}
        onClose={() => setShowAddWizard(false)}
        onSuccess={() => fetchWounds()}
      />

    </div>
  );
};
