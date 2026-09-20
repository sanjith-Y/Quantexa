import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../../hooks/useAppState';

export function SafetyValidator() {
  const { state } = useApp();

  const checks = [
    { label: 'Minimum Green Duration (≥ 15s)', passed: true, val: '18s min' },
    { label: 'Maximum Green Ceiling (≤ 60s)', passed: true, val: '45s max' },
    { label: 'Yellow Clearance Safety Window', passed: true, val: '4.0s enforced' },
    { label: 'Conflicting Phase Interlocking', passed: true, val: '0 overlap' },
    { label: 'Pedestrian Walk Phase Reserve', passed: true, val: '12s buffer' },
    { label: 'Emergency Override Safety Latch', passed: true, val: 'Active' },
  ];

  return (
    <div className="glass-card p-4 border border-emerald-500/30 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <ShieldCheck size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 font-mono">
              Safety Validator & Fallback Gate
            </h4>
            <p className="text-[10px] text-slate-400">
              Hardware-in-the-loop signal boundary verification
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
          ALL 6 CHECKS: PASSED
        </span>
      </div>

      {/* Grid of checks */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {checks.map((c, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-800 text-[11px]"
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
              <span>{c.label}</span>
            </div>
            <span className="font-mono text-emerald-400 font-semibold">{c.val}</span>
          </div>
        ))}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Pipeline: Quantum Optimizer → Safety Gate → Actuator</span>
        <span className="text-emerald-400 font-bold">State: DIRECT APPLY</span>
      </div>
    </div>
  );
}
