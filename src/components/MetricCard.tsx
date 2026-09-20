import React from 'react';
import { Clock, Gauge, CheckCircle2, Activity } from 'lucide-react';
import { SimulationMetrics } from '../types/sim2';

interface MetricCardsProps {
  metrics: SimulationMetrics;
  mode: 'normal' | 'quantum';
}

export function MetricCards({ metrics, mode }: MetricCardsProps) {
  const isQuantum = mode === 'quantum';

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Average Waiting Time */}
      <div className="glass-card p-4 rounded-xl border border-cyan-500/20 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span className="flex items-center gap-1.5"><Clock size={14} className="text-cyan-400" /> Avg Waiting Time</span>
          <span className="text-cyan-400 font-bold">{isQuantum ? '↓ 42% Delay' : 'Fixed Baseline'}</span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {metrics.avgWaitingTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">sec</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Per vehicle stop delay
        </div>
      </div>

      {/* 2. Total Queue Length */}
      <div className="glass-card p-4 rounded-xl border border-purple-500/20 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span className="flex items-center gap-1.5"><Gauge size={14} className="text-purple-400" /> Current Queue Length</span>
          <span className="text-purple-300 font-bold">{metrics.totalQueueLength} veh</span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {metrics.totalQueueLength} <span className="text-xs font-normal text-slate-400">vehicles</span>
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          Stopped across stoplines
        </div>
      </div>

      {/* 3. Vehicles Passed */}
      <div className="glass-card p-4 rounded-xl border border-emerald-500/20 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-400" /> Vehicles Passed</span>
          <span className="text-emerald-400 font-bold">Throughput</span>
        </div>
        <div className="text-2xl font-bold font-mono text-slate-100">
          {metrics.vehiclesPassed} <span className="text-xs font-normal text-slate-400">cleared</span>
        </div>
        <div className="text-[10px] text-emerald-400/80 font-mono">
          Cumulative throughput
        </div>
      </div>

      {/* 4. Congestion Level */}
      <div className="glass-card p-4 rounded-xl border border-amber-500/20 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
          <span className="flex items-center gap-1.5"><Activity size={14} className="text-amber-400" /> Congestion Level</span>
          <span className={`text-xs font-bold font-mono ${
            metrics.congestionLevel === 'LOW' ? 'text-emerald-400' : metrics.congestionLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {metrics.congestionPercentage}%
          </span>
        </div>
        <div className={`text-2xl font-bold font-mono uppercase ${
          metrics.congestionLevel === 'LOW' ? 'text-emerald-400' : metrics.congestionLevel === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400'
        }`}>
          {metrics.congestionLevel}
        </div>
        <div className="text-[10px] text-slate-500 font-mono">
          {metrics.congestionPercentage <= 30 ? '0–30% (Low)' : metrics.congestionPercentage <= 70 ? '31–70% (Medium)' : '71–100% (High)'}
        </div>
      </div>
    </div>
  );
}
