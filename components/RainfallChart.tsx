import React from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MonitorLog } from '../types';

interface RainfallChartProps {
  logs: MonitorLog[];
  height?: number;
}

export const RainfallChart: React.FC<RainfallChartProps> = ({ logs, height = 80 }) => {
  // If no logs, return null or placeholder
  if (!logs || logs.length === 0) return null;

  // Transform data for chart if necessary, though logs structure is pretty good
  // We want to show cumulative usually, or hourly bars. Let's do hourly bars (amount) + cumulative line?
  // For this small view, just an area chart of the Amount (Precipitation Intensity) looks best visually.
  const data = logs.map(log => ({
    time: log.date.split(' ')[1] || log.date, // extract HH:00
    amount: log.amount
  }));

  return (
    <div style={{ height }} className="w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00C48C" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00C48C" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            itemStyle={{ color: '#00C48C', fontWeight: 600, fontSize: '12px' }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number) => [`${value.toFixed(1)} mm`, 'Rain']}
          />
          <Area 
            type="monotone" 
            dataKey="amount" 
            stroke="#00C48C" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRain)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};