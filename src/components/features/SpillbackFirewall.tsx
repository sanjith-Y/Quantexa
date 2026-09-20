import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../hooks/useAppState';
import { motion } from 'framer-motion';

export function SpillbackFirewall() {
  const { state } = useApp();
  const spillbackAlerts = state.spillbackAlerts;

  const activeAlert = spillbackAlerts.length > 0 ? spillbackAlerts[0] : null;

  return (
    <div className="glass-card p-4 border border-amber-500/30 rounded-xl relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <ShieldAlert size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 font-mono">
              Unique Feature 2: Queue Spillback Firewall
            </h4>
            <p className="text-[10px] text-slate-400">
              Downstream congestion & cascade overflow prevention
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${activeAlert ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'}`}>
          {activeAlert ? 'THREAT DETECTED' : 'FIREWALL ACTIVE'}
        </span>
      </div>

      {/* Content */}
      {activeAlert ? (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 bg-amber-950/20 p-3 rounded-lg border border-amber-500/20 text-xs"
        >
          <div className="flex items-center justify-between text-amber-200">
            <span className="font-semibold flex items-center gap-1">
              <AlertTriangle size={13} className="text-amber-400" />
              Spillback Bottleneck: {activeAlert.fromIntersection} → {activeAlert.toIntersection}
            </span>
            <span className="font-mono text-[11px] text-amber-400 font-bold">
              ETA: in {activeAlert.spillbackTime.toFixed(0)}s
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            "{activeAlert.toIntersection} predicted to exceed 90% capacity in {activeAlert.spillbackTime.toFixed(0)} seconds. Upstream feeder {activeAlert.fromIntersection} green window throttled by 6s."
          </p>

          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-1">
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Current Queue</span>
              <span className="text-amber-300 font-bold">{activeAlert.currentQueue} veh</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Predicted Queue</span>
              <span className="text-rose-400 font-bold">{activeAlert.predictedQueue} veh</span>
            </div>
            <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800">
              <span className="text-slate-400 block">Action</span>
              <span className="text-emerald-400 font-bold">Auto-Throttled</span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span>Downstream queues within nominal tolerances. Zero spillback cascade predicted.</span>
          </div>
          <span className="font-mono text-[10px] text-cyan-400">P(Spillback) &lt; 4%</span>
        </div>
      )}
    </div>
  );
}
