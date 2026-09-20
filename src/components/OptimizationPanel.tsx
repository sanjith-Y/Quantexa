import React from 'react';
import { Shield, Zap, CheckCircle2, Binary, Sliders, Info } from 'lucide-react';
import { OptimizationResult } from '../types/sim2';

interface OptimizationPanelProps {
  result: OptimizationResult | null;
  mode: 'normal' | 'quantum';
}

export function OptimizationPanel({ result, mode }: OptimizationPanelProps) {
  return (
    <div className="space-y-4">
      {/* 1. Objective Function Card */}
      <div className="glass-card p-5 rounded-xl border border-purple-500/30 space-y-3 bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-purple-300 font-mono font-bold text-xs uppercase">
            <Shield size={16} /> Optimization Objective Formulation
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30 font-semibold">
            QUBO / QAOA
          </span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-cyan-400 font-bold">
            Min Total Cost = Waiting Time + Queue Length + Congestion
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
            Subject to traffic-signal constraints: Minimum green duration (≥ 12s), maximum green duration (≤ 28s), yellow clearance (3s), and safe non-conflicting phase switching.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/20 flex items-start gap-2.5 text-[11px] text-slate-300">
          <Info size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="text-purple-300">Simulated QAOA / QUBO Optimization:</strong> This demonstration uses simulated quantum-inspired optimization algorithms on classical hardware to evaluate combinatorial signal split states.
          </p>
        </div>
      </div>

      {/* 2. Optimization Result Card */}
      <div className="glass-card p-5 rounded-xl border border-cyan-500/30 space-y-3 bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-xs uppercase">
            <CheckCircle2 size={16} /> Optimization Result Card
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-bold">
            {mode === 'quantum' ? 'APPLIED TO SIGNALS' : 'STANDBY'}
          </span>
        </div>

        {result ? (
          <div className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">QUBO Variables</span>
                <span className="text-purple-300 font-bold">{result.quboVariables} Qubits</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Candidate States</span>
                <span className="text-cyan-300 font-bold">{result.candidateSolutions}</span>
              </div>
              <div className="bg-slate-900 p-2 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Min Cost Energy</span>
                <span className="text-emerald-400 font-bold">{result.bestObjectiveValue} J</span>
              </div>
            </div>

            <div className="bg-slate-900/90 p-2.5 rounded border border-purple-500/30 flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Binary size={13} className="text-purple-400" /> Optimal QAOA Bitstring:
              </span>
              <span className="text-cyan-400 font-bold font-mono tracking-widest bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {result.bitstring}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Intersection 1 (North)</span>
                <span className="text-cyan-300 font-bold">N-S Green: {result.i1NsGreen}s</span>
                <span className="text-slate-500 block text-[10px]">E-W Green: {result.i1EwGreen}s</span>
              </div>
              <div className="bg-slate-950 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Intersection 2 (South)</span>
                <span className="text-purple-300 font-bold">N-S Green: {result.i2NsGreen}s</span>
                <span className="text-slate-500 block text-[10px]">E-W Green: {result.i2EwGreen}s</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-slate-500 text-xs font-mono">
            Click "RUN OPTIMIZATION" above to evaluate real-time QUBO Hamiltonian.
          </div>
        )}
      </div>
    </div>
  );
}
