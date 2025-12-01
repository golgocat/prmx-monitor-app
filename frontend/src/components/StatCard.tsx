import React, { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  borderColor: string;
  textColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  icon, 
  borderColor, 
  textColor = 'text-slate-800' 
}) => {
  return (
    <div className={`relative overflow-hidden bg-white/70 backdrop-blur-md border-l-4 ${borderColor} rounded-2xl p-6 shadow-sm border border-white/50 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <div className="p-2 rounded-lg bg-slate-50 shadow-sm border border-slate-100">{icon}</div>
      </div>
      <div className={`text-4xl font-bold tracking-tight ${textColor}`}>{value}</div>
    </div>
  );
};