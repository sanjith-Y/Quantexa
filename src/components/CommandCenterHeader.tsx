import React, { useState, useEffect } from 'react';
import { Zap, Activity, Clock, ShieldCheck, Monitor } from 'lucide-react';
import { useApp } from '../hooks/useAppState';

interface CommandCenterHeaderProps {
  simulationTime: number;
  mode: 'normal' | 'quantum';
  vehicleCount: number;
}

export function CommandCenterHeader({ simulationTime, mode, vehicleCount }: CommandCenterHeaderProps) {
  const { state, dispatch } = useApp();

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-3 mb-4 select-none">
      {/* 3. HERO HEADER - LEFT */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 text-lg">
          Q
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-black font-mono tracking-wider text-slate-100 uppercase">
              QUANTUM <span className="text-cyan-400">TRAFFIC</span> OPTIMIZATION
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-bold">
              v2.8 AI-CORE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">
            Adaptive Signal Intelligence · Smart City Command Center
          </p>
        </div>
      </div>

      {/* 3. HERO HEADER - CENTER: Animated Status Indicator */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono shadow-inner">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-emerald-400 font-bold tracking-wider">● SYSTEM ONLINE</span>
      </div>

      {/* 3. HERO HEADER - RIGHT: Technical Badges */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/20 text-cyan-300">
          <Activity size={13} className="text-cyan-400" />
          <span>SIMULATION: LIVE {formatTime(simulationTime)}</span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-purple-500/30 text-purple-300">
          <Zap size={13} className="text-purple-400" />
          <span>OPTIMIZER: READY</span>
        </div>

        {/* Technical metadata tags */}
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-500 border-l border-slate-800 pl-3">
          <span>NODES: 02</span>
          <span>•</span>
          <span>VEHICLES: {vehicleCount}</span>
        </div>
      </div>
    </header>
  );
}
