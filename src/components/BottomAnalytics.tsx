import React from 'react';
import { ChartPoint, SimulationMetrics } from '../types/sim2';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { BarChart2, Activity } from 'lucide-react';

interface BottomAnalyticsProps {
  chartData: ChartPoint[];
  metrics: SimulationMetrics;
  mode: 'normal' | 'quantum';
}

export function BottomAnalytics({ chartData, metrics, mode }: BottomAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
      {/* Chart 1: Waiting Time Trend */}
      <div className="glass-card p-4 rounded-xl border border-cyan-500/20 bg-slate-950/80 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs uppercase">
            <BarChart2 size={14} /> Waiting Time Over Time (seconds)
          </div>
          <span className="text-[10px] font-mono text-cyan-400">Normal vs Quantum</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="normFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="qFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} width={25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1e', borderColor: '#06b6d4', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="normalWait" name="Normal (Fixed)" stroke="#ef4444" strokeWidth={2} fill="url(#normFill)" />
              <Area type="monotone" dataKey="quantumWait" name="Quantum (QAOA)" stroke="#06b6d4" strokeWidth={2.5} fill="url(#qFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Queue Length Trend */}
      <div className="glass-card p-4 rounded-xl border border-purple-500/20 bg-slate-950/80 space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-xs uppercase">
            <Activity size={14} /> Stopline Queue Accumulation (Vehicles)
          </div>
          <span className="text-[10px] font-mono text-purple-400">Dynamic Queue Telemetry</span>
        </div>

        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="normQueueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="qQueueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
              <YAxis stroke="#64748b" fontSize={10} width={25} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0a0f1e', borderColor: '#8b5cf6', borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Area type="monotone" dataKey="normalQueue" name="Normal Queue" stroke="#f59e0b" strokeWidth={2} fill="url(#normQueueFill)" />
              <Area type="monotone" dataKey="quantumQueue" name="Quantum Queue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#qQueueFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
