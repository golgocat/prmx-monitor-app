import React, { useState } from 'react';
import { CreateMonitorDTO } from '../types';
import { AlertTriangle, MapPin, Calendar, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../config';

interface CreateMonitorProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const API_BASE = `${API_BASE_URL}/api`;

export const CreateMonitor: React.FC<CreateMonitorProps> = ({ onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMonitorDTO>({
    regionName: '',
    lat: 14.5995,
    lon: 120.9842,
    radiusKm: 10,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    triggerRainfall: 100
  });

  const handleChange = (field: keyof CreateMonitorDTO, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        lat: Number(formData.lat),
        lon: Number(formData.lon),
        radiusKm: Number(formData.radiusKm),
        triggerRainfall: Number(formData.triggerRainfall),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      };

      const res = await fetch(`${API_BASE}/monitors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to create monitor');
      onSuccess();
    } catch (err) {
      alert('Error creating monitor: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl border border-white rounded-[32px] p-8 md:p-12 shadow-2xl shadow-slate-200/50">

        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-tr from-[#00C48C] to-[#00A3FF] shadow-lg shadow-teal-200 text-white">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800">New Rainfall Protocol</h2>
          <p className="mt-2 text-slate-500">Configure oracle parameters for automated area monitoring.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Region */}
          <div className="space-y-3">
            <label className="text-xs font-bold tracking-wider uppercase text-slate-400">Region Name</label>
            <input
              type="text"
              value={formData.regionName}
              onChange={e => handleChange('regionName', e.target.value)}
              required
              className="w-full px-5 py-4 text-lg font-semibold transition-all border outline-none bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8A4AF3]/30 focus:border-[#8A4AF3] placeholder:text-slate-300"
              placeholder="e.g. Metro Manila Central"
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-400">
                <MapPin className="w-3 h-3" /> Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lat}
                onChange={e => handleChange('lat', e.target.value)}
                required
                className="w-full px-5 py-4 font-mono text-sm transition-all border outline-none bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8A4AF3]/30 focus:border-[#8A4AF3]"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-400">
                <MapPin className="w-3 h-3" /> Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={formData.lon}
                onChange={e => handleChange('lon', e.target.value)}
                required
                className="w-full px-5 py-4 font-mono text-sm transition-all border outline-none bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#8A4AF3]/30 focus:border-[#8A4AF3]"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-400">
                <Calendar className="w-3 h-3" /> Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => handleChange('startDate', e.target.value)}
                required
                className="w-full px-5 py-4 transition-all border outline-none bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00C48C]/30 focus:border-[#00C48C]"
              />
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-400">
                <Calendar className="w-3 h-3" /> End Date
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={e => handleChange('endDate', e.target.value)}
                required
                className="w-full px-5 py-4 transition-all border outline-none bg-slate-50 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00C48C]/30 focus:border-[#00C48C]"
              />
            </div>
          </div>

          {/* Trigger */}
          <div className="p-6 space-y-3 border border-red-100 bg-red-50/50 rounded-2xl">
            <label className="text-xs font-bold text-[#FF4081] uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              24h Trigger Threshold (mm)
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.triggerRainfall}
                onChange={e => handleChange('triggerRainfall', e.target.value)}
                required
                className="w-full px-5 py-4 text-2xl font-bold text-[#FF4081] bg-white border border-red-100 rounded-xl outline-none focus:ring-2 focus:ring-[#FF4081]/30 focus:border-[#FF4081]"
              />
              <span className="absolute text-sm font-bold -translate-y-1/2 right-6 top-1/2 text-red-200">MM</span>
            </div>
            <p className="text-xs text-red-400/80">
              Alert triggers if rainfall in any 24-hour rolling window exceeds this threshold.
            </p>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-4 font-bold transition-colors rounded-xl text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-[#8A4AF3] to-[#00C48C] shadow-lg shadow-purple-200 hover:shadow-xl hover:shadow-purple-300 hover:-translate-y-0.5 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  Deploying...
                </>
              ) : (
                'Deploy Monitor'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};