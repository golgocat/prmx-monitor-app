import React, { useMemo, useState } from 'react';
import { Monitor, MonitorStatus } from '../types';
import { StatCard } from './StatCard';
import { MonitorCard } from './MonitorCard';
import { Activity, CloudRain, AlertTriangle, RefreshCw, Zap, Search, X } from 'lucide-react';

interface DashboardProps {
  monitors: Monitor[];
  loading: boolean;
  onRefresh: () => void;
  onDebugRun: () => void;
}

type SortOption = 'name-asc' | 'name-desc' | 'rainfall-desc' | 'rainfall-asc' | 'status' | 'created-desc' | 'created-asc';

export const Dashboard: React.FC<DashboardProps> = ({ monitors, loading, onRefresh, onDebugRun }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created-desc');

  const stats = useMemo(() => {
    return {
      total: monitors.length,
      active: monitors.filter(m => m.status === MonitorStatus.Monitoring).length,
      triggered: monitors.filter(m => m.status === MonitorStatus.Triggered).length
    };
  }, [monitors]);

  // Filter and sort monitors
  const filteredAndSortedMonitors = useMemo(() => {
    // Filter by search query
    let filtered = monitors.filter(m =>
      m.regionName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort based on selected option
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.regionName.localeCompare(b.regionName);
        case 'name-desc':
          return b.regionName.localeCompare(a.regionName);
        case 'rainfall-desc':
          return b.current24hRainfall - a.current24hRainfall;
        case 'rainfall-asc':
          return a.current24hRainfall - b.current24hRainfall;
        case 'status':
          const statusPriority = {
            [MonitorStatus.Triggered]: 0,
            [MonitorStatus.Monitoring]: 1,
            [MonitorStatus.Instantiated]: 2,
            [MonitorStatus.Completed]: 3
          };
          return statusPriority[a.status] - statusPriority[b.status];
        case 'created-desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'created-asc':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return sorted;
  }, [monitors, searchQuery, sortBy]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Statistics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <StatCard
          label="Total Monitors"
          value={stats.total}
          icon={<Activity className="w-5 h-5 text-[#8A4AF3]" />}
          borderColor="border-[#8A4AF3]"
        />
        <StatCard
          label="Active Monitoring"
          value={stats.active}
          icon={<CloudRain className="w-5 h-5 text-[#00C48C]" />}
          borderColor="border-[#00C48C]"
        />
        <StatCard
          label="Trigger Events"
          value={stats.triggered}
          icon={<AlertTriangle className="w-5 h-5 text-[#FF4081]" />}
          borderColor="border-[#FF4081]"
          textColor="text-[#FF4081]"
        />
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Live Rain Data</h2>
            <p className="text-sm text-slate-500">
              Hourly accumulated precipitation analysis
              {searchQuery && ` • ${filteredAndSortedMonitors.length} of ${monitors.length} monitors`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDebugRun}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold transition-colors rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300"
            >
              <Zap className="w-3 h-3" />
              Test: Run Hourly Check
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 transition-all bg-white rounded-full shadow-sm hover:bg-slate-50 hover:shadow-md text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by region name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-10 text-sm transition-all border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8A4AF3] focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute p-1 transform -translate-y-1/2 transition-colors rounded-full right-2 top-1/2 hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-4 py-2 text-sm transition-all border rounded-lg border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8A4AF3] focus:border-transparent bg-white"
          >
            <option value="created-desc">Newest First</option>
            <option value="created-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="rainfall-desc">Rainfall (High-Low)</option>
            <option value="rainfall-asc">Rainfall (Low-High)</option>
            <option value="status">Status (Priority)</option>
          </select>
        </div>
      </div>

      {/* Grid Content */}
      {loading && monitors.length === 0 ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-[#8A4AF3] animate-spin" />
            <p className="text-sm font-medium text-slate-400">Syncing with Oracle...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedMonitors.map(m => (
            <MonitorCard key={m.id} data={m} />
          ))}

          {filteredAndSortedMonitors.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-slate-200">
              {searchQuery ? (
                <div>
                  <p className="text-slate-400 font-medium">No monitors found matching "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="mt-3 text-sm text-[#8A4AF3] hover:underline"
                  >
                    Clear search
                  </button>
                </div>
              ) : (
                <p className="text-slate-400 font-medium">No monitors active. Create one to start tracking.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};