import React, { useState } from 'react';
import { Monitor, MonitorStatus } from '../types';
import { Calendar, MapPin, CheckCircle2, AlertOctagon, Clock, Sparkles } from 'lucide-react';
import { RainfallChart } from './RainfallChart';
import { ForecastModal } from './ForecastModal';
import { API_BASE_URL } from '../config';

interface MonitorCardProps {
  data: Monitor;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({ data }) => {
  const [showForecast, setShowForecast] = useState(false);
  const [forecast, setForecast] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const percent = Math.min(100, (data.current24hRainfall / data.triggerRainfall) * 100);

  const handleForecastClick = async () => {
    setShowForecast(true);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/monitors/${data.id}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch forecast');
      }

      const result = await response.json();
      setForecast(result.forecast);
    } catch (err: any) {
      setError(err.message || 'Failed to generate forecast');
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    [MonitorStatus.Triggered]: {
      bg: 'bg-[#FF4081]',
      text: 'text-white',
      shadow: 'shadow-[#FF4081]/30',
      border: 'border-[#FF4081]/50',
      ring: 'ring-[#FF4081]/20',
      icon: <AlertOctagon className="w-3 h-3" />
    },
    [MonitorStatus.Monitoring]: {
      bg: 'bg-[#00C48C]',
      text: 'text-white',
      shadow: 'shadow-[#00C48C]/30',
      border: 'border-white/60',
      ring: 'ring-transparent',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    [MonitorStatus.Instantiated]: {
      bg: 'bg-[#8A4AF3]',
      text: 'text-white',
      shadow: 'shadow-[#8A4AF3]/30',
      border: 'border-white/60',
      ring: 'ring-transparent',
      icon: <Clock className="w-3 h-3" />
    },
    [MonitorStatus.Completed]: {
      bg: 'bg-slate-400',
      text: 'text-white',
      shadow: 'shadow-slate-300',
      border: 'border-slate-200',
      ring: 'ring-transparent',
      icon: <CheckCircle2 className="w-3 h-3" />
    }
  };

  const currentStatus = statusConfig[data.status] || statusConfig[MonitorStatus.Instantiated];
  const isTriggered = data.status === MonitorStatus.Triggered;

  return (
    <>
      <div className={`group relative flex flex-col justify-between overflow-hidden bg-white/70 backdrop-blur-md rounded-[24px] p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border ${currentStatus.border} ${isTriggered ? 'ring-2 ' + currentStatus.ring : ''}`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-mono">
              {data.locationKey || 'PENDING ID'}
            </div>
            <h3 className="text-xl font-bold leading-tight text-slate-800 transition-colors group-hover:text-[#8A4AF3]">
              {data.regionName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Gemini Forecast Button */}
            <button
              onClick={handleForecastClick}
              className="group/btn relative p-2 rounded-xl bg-gradient-to-r from-[#4285F4] via-[#9B72F2] to-[#F538A0] shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
              title="Get AI Weather Forecast"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#4285F4] via-[#9B72F2] to-[#F538A0] opacity-0 group-hover/btn:opacity-100 blur-md transition-opacity duration-300" />
            </button>

            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-md ${currentStatus.bg} ${currentStatus.text} ${currentStatus.shadow}`}>
              {currentStatus.icon}
              {data.status}
            </span>
          </div>
        </div>

        {/* Main Metric */}
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <span className="text-4xl font-bold tracking-tighter text-slate-900">
                {data.current24hRainfall.toFixed(1)}
              </span>
              <span className="ml-1.5 text-sm font-medium text-slate-400">mm</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">24h Threshold</span>
              <div className={`text-sm font-bold ${isTriggered ? 'text-[#FF4081]' : 'text-slate-600'}`}>
                {data.triggerRainfall} mm
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-4 overflow-hidden rounded-full bg-slate-100 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${isTriggered ? 'bg-gradient-to-r from-[#FF4081] to-[#FFA000]' : 'bg-gradient-to-r from-[#00C48C] to-[#00A3FF]'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Chart (Hidden if no logs) */}
        <div className="flex-grow min-h-[60px]">
          {data.logs && data.logs.length > 0 && (
            <RainfallChart logs={data.logs} />
          )}
        </div>

        {/* Footer Info */}
        <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-[#8A4AF3]" />
            <span>{new Date(data.startDate).toLocaleDateString()} - {new Date(data.endDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs font-medium text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-[#00C48C]" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${data.lat},${data.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono transition-colors hover:text-[#00C48C] hover:underline"
            >
              {data.lat.toFixed(2)}, {data.lon.toFixed(2)}
            </a>
          </div>
        </div>
      </div>

      {/* Forecast Modal */}
      <ForecastModal
        isOpen={showForecast}
        onClose={() => setShowForecast(false)}
        forecast={forecast}
        regionName={data.regionName}
        loading={loading}
        error={error}
      />
    </>
  );
};