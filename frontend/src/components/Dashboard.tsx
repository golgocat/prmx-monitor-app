import React, { useMemo } from 'react';
import { Monitor, MonitorStatus } from '../types';
import { StatCard } from './StatCard';
import { MonitorCard } from './MonitorCard';
import { Activity, CloudRain, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

interface DashboardProps {
  monitors: Monitor[];
  loading: boolean;
  onRefresh: () => void;
  onDebugRun: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ monitors, loading, onRefresh, onDebugRun }) => {
  
  const stats = useMemo(() => {
    return {
      total: monitors.length,
      active: monitors.filter(m => m.status === MonitorStatus.Monitoring).length,
      triggered: monitors.filter(m => m.status === MonitorStatus.Triggered).length
    };
  }, [monitors]);

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
      <div className="flex flex-col items-end justify-between gap-4 pb-4 border-b border-slate-200 md:flex-row md:items-end">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Live Rain Data</h2>
           <p className="text-sm text-slate-500">Hourly accumulated precipitation analysis</p>
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
          {monitors.map(m => (
            <MonitorCard key={m.id} data={m} />
          ))}
          
          {monitors.length === 0 && !loading && (
             <div className="col-span-full py-20 text-center border-2 border-dashed rounded-3xl border-slate-200">
                <p className="text-slate-400 font-medium">No monitors active. Create one to start tracking.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};