import React from 'react';
import { Scale, Zap, Check, ArrowRightLeft } from 'lucide-react';
import { useApp } from '../../hooks/useAppState';

export function ConflictResolver() {
  const { state } = useApp();
  const emergencyActive = state.emergency.active;

  return (
    <div className="glass-card p-4 border border-purple-500/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Scale size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
              Unique Feature 3: Quantum Conflict Resolver
            </h4>
            <p className="text-[10px] text-slate-400">
              Pareto multi-objective tradeoff balancing
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
          HYBRID QAOA PARETO
        </span>
      </div>

      <div className="space-y-2.5 text-xs">
        <p className="text-slate-300 text-[11px]">
          Instead of naive 100% emergency lockouts causing network paralysis, QAOA computes the global optimum across 5 competing cost functions:
        </p>

        {/* Sliders breakdown */}
        <div className="space-y-2 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-cyan-400">Emergency Priority (w₁)</span>
            <span className="text-slate-200 font-bold">{emergencyActive ? '75%' : '20%'}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-500"
              style={{ width: emergencyActive ? '75%' : '20%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className="text-slate-300">Normal Traffic Delay (w₂)</span>
            <span className="text-slate-200 font-bold">{emergencyActive ? '15%' : '40%'}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-400 transition-all duration-500"
              style={{ width: emergencyActive ? '15%' : '40%' }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono pt-1">
            <span className="text-amber-400">Spillback & CO₂ Penalty (w₃)</span>
            <span className="text-slate-200 font-bold">{emergencyActive ? '10%' : '40%'}</span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: emergencyActive ? '10%' : '40%' }}
            />
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 flex items-center justify-between text-[11px]">
          <span className="text-purple-300 flex items-center gap-1.5">
            <Zap size={13} className="text-purple-400" />
            Optimal Strategy Selected by Hybrid Optimizer
          </span>
          <span className="font-mono text-cyan-400 font-bold">Cost Score: -42.8 J</span>
        </div>
      </div>
    </div>
  );
}
