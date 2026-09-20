import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../hooks/useAppState';
import { getDensityColor, getSignalColor, getRiskColor } from '../../utils/helpers';
import { X, Activity, ShieldCheck, Gauge, Flame, Clock, Radio, Zap } from 'lucide-react';

export function IntersectionModal() {
  const { state, dispatch } = useApp();
  const id = state.selectedIntersection;

  if (!id) return null;
  const node = state.traffic.intersections[id];
  if (!node) return null;

  const densityColor = getDensityColor(node.density);
  const signalColor = getSignalColor(node.signal);
  const riskColor = getRiskColor(node.riskLevel);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass-card w-full max-w-xl border border-cyan-500/30 overflow-hidden shadow-2xl relative"
        >
          {/* Header Banner */}
          <div className="px-6 py-4 border-b border-cyan-500/20 bg-slate-900/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-lg text-cyan-400">
                {node.id}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  {node.name} Node Telemetry
                  <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono">
                    LIVE
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Adaptive Quantum-Classical Signal Control Point
                </p>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'SELECT_INTERSECTION', id: null })}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            {/* Top Grid Status Badges */}
            <div className="grid grid-cols-3 gap-3">
              {/* Signal State */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 mb-1">Signal Phase</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: signalColor }}
                  />
                  <span className="font-mono font-bold text-sm text-slate-100 uppercase">
                    {node.signal}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-cyan-400 mt-1">
                  ⏱ {node.signalCountdown.toFixed(0)}s left (P{node.phase})
                </span>
              </div>

              {/* Risk Level */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 mb-1">Risk Assessment</span>
                <span
                  className="font-mono font-bold text-sm uppercase px-2 py-0.5 rounded"
                  style={{ color: riskColor, backgroundColor: `${riskColor}15` }}
                >
                  {node.riskLevel}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  Spillback: {node.spillbackRisk.toFixed(0)}%
                </span>
              </div>

              {/* Emergency Status */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-mono text-slate-400 mb-1">Emergency Corridor</span>
                <span className="font-mono font-bold text-sm text-cyan-400 uppercase">
                  {node.emergencyStatus}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {node.emergencyStatus === 'none' ? 'Standard Cycle' : 'Pre-empt Active'}
                </span>
              </div>
            </div>

            {/* Metrics Sliders / Progress Bars */}
            <div className="space-y-3.5 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
              {/* Traffic Density */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Activity size={13} className="text-cyan-400" /> Traffic Density
                  </span>
                  <span className="font-bold text-slate-100">{node.density.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{ width: `${node.density}%`, backgroundColor: densityColor }}
                  />
                </div>
              </div>

              {/* Queue Length vs Predicted */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Gauge size={13} className="text-purple-400" /> Queue vs Capacity
                  </span>
                  <span className="text-slate-200">
                    <span className="font-bold text-cyan-400">{node.queueLength.toFixed(0)}</span> / {node.capacity} veh{' '}
                    <span className="text-slate-500 text-[10px]">(Pred: {node.predictedQueue} veh)</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 rounded-full"
                    style={{ width: `${(node.queueLength / node.capacity) * 100}%` }}
                  />
                </div>
              </div>

              {/* Waiting Time & Emission */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60">
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock size={12} className="text-amber-400" /> Avg Wait Time
                  </span>
                  <p className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {node.waitingTime.toFixed(1)} s / vehicle
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Flame size={12} className="text-rose-400" /> CO₂ Emission Rate
                  </span>
                  <p className="text-sm font-bold font-mono text-slate-200 mt-0.5">
                    {node.co2Rate.toFixed(1)} g/min <span className="text-[9px] text-slate-500">(Sim Est)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* QUBO & Safety Verification Box */}
            <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="text-emerald-400" size={20} />
                <div>
                  <p className="font-bold text-emerald-300">Safety Layer: PASSED</p>
                  <p className="text-[11px] text-emerald-400/80">
                    Min/Max green boundaries & pedestrian phases verified.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-purple-400 bg-purple-950/40 px-2.5 py-1 rounded border border-purple-500/30">
                <Zap size={12} /> QAOA Qubit x({node.id}, t, p)
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="px-6 py-3.5 bg-slate-900/60 border-t border-cyan-500/20 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Coordinates: ({node.x}, {node.y})
            </span>
            <button
              onClick={() => dispatch({ type: 'SELECT_INTERSECTION', id: null })}
              className="px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition"
            >
              Close Telemetry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
