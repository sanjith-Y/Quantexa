import React from 'react';
import { Play, Pause, RotateCcw, Zap, Sliders } from 'lucide-react';

interface ControlPanelProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
  mode: 'normal' | 'quantum';
  onSetMode: (m: 'normal' | 'quantum') => void;
  density: 'low' | 'medium' | 'high';
  onSetDensity: (d: 'low' | 'medium' | 'high') => void;
}

export function ControlPanel({
  isRunning,
  onTogglePlay,
  onReset,
  onRunOptimization,
  isOptimizing,
  mode,
  onSetMode,
  density,
  onSetDensity,
}: ControlPanelProps) {
  return (
    <div className="glass-card p-4 rounded-xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
      {/* Simulation Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePlay}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition ${
            isRunning
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold shadow-lg shadow-emerald-500/20'
          }`}
        >
          {isRunning ? <Pause size={14} /> : <Play size={14} />}
          {isRunning ? 'PAUSE' : 'START'}
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-mono font-semibold flex items-center gap-1.5 transition"
        >
          <RotateCcw size={13} /> RESET
        </button>
      </div>

      {/* Traffic Density Selector */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-mono">
        <span className="text-slate-500 px-2 text-[10px] uppercase font-bold">Traffic Density:</span>
        {(['low', 'medium', 'high'] as const).map((d) => (
          <button
            key={d}
            onClick={() => onSetDensity(d)}
            className={`px-3 py-1 rounded-lg uppercase text-[11px] font-bold transition ${
              density === d
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-1 text-xs font-mono">
        <button
          onClick={() => onSetMode('normal')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            mode === 'normal'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders size={13} /> NORMAL TIMING
        </button>
        <button
          onClick={() => onSetMode('quantum')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
            mode === 'quantum'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap size={13} /> QUANTUM / QUBO
        </button>
      </div>

      {/* Main Run Optimization Action */}
      <button
        onClick={onRunOptimization}
        disabled={isOptimizing}
        className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 via-cyan-500 to-emerald-500 hover:from-purple-500 hover:to-emerald-400 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg shadow-purple-500/20 flex items-center gap-2 transition hover:scale-105"
      >
        <Zap size={14} className={isOptimizing ? 'animate-spin' : ''} />
        {isOptimizing ? 'Executing QAOA...' : 'RUN OPTIMIZATION'}
      </button>
    </div>
  );
}
