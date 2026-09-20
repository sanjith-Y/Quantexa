import React from 'react';
import { Vehicle, IntersectionSignal } from '../types/sim2';

interface TrafficSimulationProps {
  vehicles: Vehicle[];
  signal1: IntersectionSignal;
  signal2: IntersectionSignal;
  mode: 'normal' | 'quantum';
}

export function TrafficSimulation({ vehicles, signal1, signal2, mode }: TrafficSimulationProps) {
  return (
    <div className="relative w-full rounded-2xl glass-card border border-cyan-500/30 overflow-hidden bg-slate-950/95 shadow-2xl p-2 select-none">
      {/* Top Banner Tag */}
      <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur px-3 py-1.5 rounded-lg border border-cyan-500/20 text-xs font-mono">
        <div className={`w-2 h-2 rounded-full ${mode === 'quantum' ? 'bg-purple-400 animate-ping' : 'bg-cyan-400'}`} />
        <span className="text-slate-300 font-semibold uppercase">
          {mode === 'quantum' ? 'Quantum/QUBO Optimized Grid' : 'Conventional Fixed Timing Grid'}
        </span>
      </div>

      <svg viewBox="0 0 800 600" className="w-full h-auto rounded-xl">
        <defs>
          <linearGradient id="roadBase" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="lightGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ================= ROADS ================= */}
        {/* Intersection 1 East-West Arterial */}
        <rect x="0" y="120" width="800" height="60" fill="url(#roadBase)" stroke="#334155" strokeWidth="1.5" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="#facc15" strokeWidth="2" strokeDasharray="8 6" />

        {/* Intersection 2 East-West Arterial */}
        <rect x="0" y="400" width="800" height="60" fill="url(#roadBase)" stroke="#334155" strokeWidth="1.5" />
        <line x1="0" y1="430" x2="800" y2="430" stroke="#facc15" strokeWidth="2" strokeDasharray="8 6" />

        {/* Connecting Vertical Highway (Links Intersection 1 & Intersection 2) */}
        <rect x="370" y="0" width="60" height="600" fill="url(#roadBase)" stroke="#334155" strokeWidth="1.5" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#facc15" strokeWidth="2" strokeDasharray="8 6" />

        {/* ================= STOPLINES ================= */}
        {/* Intersection 1 Stoplines */}
        <line x1="370" y1="110" x2="430" y2="110" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="370" y1="190" x2="430" y2="190" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="360" y1="120" x2="360" y2="180" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="440" y1="120" x2="440" y2="180" stroke="#ef4444" strokeWidth="3" opacity="0.8" />

        {/* Intersection 2 Stoplines */}
        <line x1="370" y1="390" x2="430" y2="390" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="370" y1="470" x2="430" y2="470" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="360" y1="400" x2="360" y2="460" stroke="#ef4444" strokeWidth="3" opacity="0.8" />
        <line x1="440" y1="400" x2="440" y2="460" stroke="#ef4444" strokeWidth="3" opacity="0.8" />

        {/* ================= CARS LAYER ================= */}
        {vehicles.map((v) => (
          <g key={v.id}>
            {/* Vehicle Body */}
            <rect
              x={v.x - (v.type === 'truck' ? 10 : 7)}
              y={v.y - (v.type === 'truck' ? 5 : 4)}
              width={v.type === 'truck' ? 20 : v.type === 'bus' ? 18 : 14}
              height={v.type === 'truck' ? 10 : 8}
              rx="2"
              fill={v.color}
              stroke="#030712"
              strokeWidth="1.2"
            />
            {/* Brake lights indicator if stopped */}
            {v.stopped && (
              <circle cx={v.x - 6} cy={v.y} r="2" fill="#ef4444" filter="url(#lightGlow)" />
            )}
          </g>
        ))}

        {/* ================= TRAFFIC LIGHTS HOUSINGS ================= */}
        {/* Intersection 1 (North Hub) Display Badge */}
        <g transform="translate(455, 60)">
          <rect width="180" height="50" rx="8" fill="#030712" stroke="#06b6d4" strokeWidth="1.5" opacity="0.95" />
          <text x="90" y="16" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
            INTERSECTION 1 (NORTH)
          </text>
          {/* N-S Light */}
          <circle cx="28" cy="34" r="6" fill={signal1.nsLight === 'GREEN' ? '#10b981' : signal1.nsLight === 'YELLOW' ? '#f59e0b' : '#ef4444'} filter="url(#lightGlow)" />
          <text x="42" y="38" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">
            N-S: {signal1.nsLight === 'GREEN' ? `GRN ${signal1.countdown.toFixed(0)}s` : signal1.nsLight}
          </text>
          {/* E-W Light */}
          <circle cx="115" cy="34" r="6" fill={signal1.ewLight === 'GREEN' ? '#10b981' : signal1.ewLight === 'YELLOW' ? '#f59e0b' : '#ef4444'} filter="url(#lightGlow)" />
          <text x="129" y="38" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">
            E-W: {signal1.ewLight === 'GREEN' ? `GRN ${signal1.countdown.toFixed(0)}s` : signal1.ewLight}
          </text>
        </g>

        {/* Intersection 2 (South Hub) Display Badge */}
        <g transform="translate(455, 340)">
          <rect width="180" height="50" rx="8" fill="#030712" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.95" />
          <text x="90" y="16" fill="#c084fc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono" textAnchor="middle">
            INTERSECTION 2 (SOUTH)
          </text>
          {/* N-S Light */}
          <circle cx="28" cy="34" r="6" fill={signal2.nsLight === 'GREEN' ? '#10b981' : signal2.nsLight === 'YELLOW' ? '#f59e0b' : '#ef4444'} filter="url(#lightGlow)" />
          <text x="42" y="38" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">
            N-S: {signal2.nsLight === 'GREEN' ? `GRN ${signal2.countdown.toFixed(0)}s` : signal2.nsLight}
          </text>
          {/* E-W Light */}
          <circle cx="115" cy="34" r="6" fill={signal2.ewLight === 'GREEN' ? '#10b981' : signal2.ewLight === 'YELLOW' ? '#f59e0b' : '#ef4444'} filter="url(#lightGlow)" />
          <text x="129" y="38" fill="#cbd5e1" fontSize="10" fontFamily="JetBrains Mono">
            E-W: {signal2.ewLight === 'GREEN' ? `GRN ${signal2.countdown.toFixed(0)}s` : signal2.ewLight}
          </text>
        </g>

        {/* Connecting Arterial Link Label */}
        <g transform="translate(180, 275)">
          <rect width="180" height="28" rx="6" fill="#030712" stroke="#334155" strokeWidth="1" opacity="0.9" />
          <text x="90" y="18" fill="#94a3b8" fontSize="11" fontFamily="JetBrains Mono" textAnchor="middle">
            ↕ Inter-Junction Arterial Link
          </text>
        </g>
      </svg>
    </div>
  );
}
