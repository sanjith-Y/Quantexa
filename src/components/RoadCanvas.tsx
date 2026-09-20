import React from 'react';
import { Vehicle, IntersectionSignal } from '../types/sim2';

interface RoadCanvasProps {
  vehicles: Vehicle[];
  signal1: IntersectionSignal;
  signal2: IntersectionSignal;
  mode: 'normal' | 'quantum';
  density: 'low' | 'medium' | 'high';
}

export function RoadCanvas({ vehicles, signal1, signal2, mode, density }: RoadCanvasProps) {
  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-[#030712] border border-cyan-500/20 shadow-2xl select-none flex flex-col justify-center items-center">
      {/* Subtle Technical Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top Left Mode Badge */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30 text-[11px] font-mono shadow-lg">
        <div className={`w-2 h-2 rounded-full ${mode === 'quantum' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
        <span className="text-slate-200 font-semibold uppercase tracking-wider">
          {mode === 'quantum' ? 'Quantum Mesh Control' : 'Fixed Round-Robin Grid'}
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400 font-bold">2 Synced Hubs (J1 ↔ J2)</span>
      </div>

      {/* Top Right Density Badge */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono shadow-lg">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">J1 DENSITY:</span>
          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${density === 'high' ? 'bg-rose-500' : density === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: density === 'high' ? '82%' : density === 'medium' ? '56%' : '32%' }}
            />
          </div>
          <span className="text-slate-200 font-bold">{density === 'high' ? '82%' : density === 'medium' ? '56%' : '32%'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">J2 DENSITY:</span>
          <div className="w-14 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${density === 'high' ? 'bg-rose-500' : density === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: density === 'high' ? '74%' : density === 'medium' ? '48%' : '28%' }}
            />
          </div>
          <span className="text-slate-200 font-bold">{density === 'high' ? '74%' : density === 'medium' ? '48%' : '28%'}</span>
        </div>
      </div>

      {/*
        SVG Coordinate System — aligned exactly with vehicleEngine.ts:
          I1 EW road   : y = 120–180  (lane centres: y=135 westbound, y=165 eastbound, divider y=150)
          I2 EW road   : y = 400–460  (lane centres: y=415 westbound, y=445 eastbound, divider y=430)
          Vertical link: x = 370–430  (lane centres: x=385 southbound, x=415 northbound, divider x=400)
          vehicleEngine spawn / stoplines:
            I1_NORTH  spawn y=10,  stop y=100  → travels down toward intersection (y=150)
            I1_WEST   spawn x=10,  stop x=345  → travels right
            I1_EAST   spawn x=790, stop x=455  → travels left
            LINK_DOWN  spawn y=200, stop y=380  → southbound between junctions
            LINK_UP    spawn y=370, stop y=—    → northbound between junctions
            I2_SOUTH  spawn y=570, stop y=480  → travels up
            I2_WEST   spawn x=10,  stop x=345
            I2_EAST   spawn x=790, stop x=455
      */}
      <svg viewBox="0 0 800 600" className="w-full h-auto max-h-[580px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="asphaltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0b1120" />
            <stop offset="50%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#0b1120" />
          </linearGradient>
          <filter id="greenGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="yellowGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="headlightGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ======= ROADS ======= */}
        {/* I1 East-West  y=120 to y=180 */}
        <rect x="0" y="120" width="800" height="60" fill="url(#asphaltGrad)" />
        <line x1="0" y1="120" x2="800" y2="120" stroke="#334155" strokeWidth="2" />
        <line x1="0" y1="180" x2="800" y2="180" stroke="#334155" strokeWidth="2" />
        <line x1="0" y1="150" x2="800" y2="150" stroke="#eab308" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.8" />

        {/* I2 East-West  y=400 to y=460 */}
        <rect x="0" y="400" width="800" height="60" fill="url(#asphaltGrad)" />
        <line x1="0" y1="400" x2="800" y2="400" stroke="#334155" strokeWidth="2" />
        <line x1="0" y1="460" x2="800" y2="460" stroke="#334155" strokeWidth="2" />
        <line x1="0" y1="430" x2="800" y2="430" stroke="#eab308" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.8" />

        {/* Vertical Link  x=370 to x=430 */}
        <rect x="370" y="0" width="60" height="600" fill="url(#asphaltGrad)" />
        <line x1="370" y1="0" x2="370" y2="600" stroke="#334155" strokeWidth="2" />
        <line x1="430" y1="0" x2="430" y2="600" stroke="#334155" strokeWidth="2" />
        <line x1="400" y1="0" x2="400" y2="600" stroke="#eab308" strokeWidth="1.5" strokeDasharray="10 8" opacity="0.8" />

        {/* Intersection boxes (clear kerb lines inside junction) */}
        <rect x="370" y="120" width="60" height="60" fill="url(#asphaltGrad)" />
        <rect x="370" y="400" width="60" height="60" fill="url(#asphaltGrad)" />

        {/* ======= CROSSWALKS ======= */}
        {[0, 7, 14, 21, 28, 35, 42, 49].map(off => (
          <g key={`cw1-${off}`} opacity="0.35">
            <rect x={373 + off} y={108} width={4} height={11} fill="#f8fafc" rx="1" />
            <rect x={373 + off} y={181} width={4} height={11} fill="#f8fafc" rx="1" />
            <rect x={358} y={123 + off} width={11} height={4} fill="#f8fafc" rx="1" />
            <rect x={431} y={123 + off} width={11} height={4} fill="#f8fafc" rx="1" />
          </g>
        ))}
        {[0, 7, 14, 21, 28, 35, 42, 49].map(off => (
          <g key={`cw2-${off}`} opacity="0.35">
            <rect x={373 + off} y={388} width={4} height={11} fill="#f8fafc" rx="1" />
            <rect x={373 + off} y={461} width={4} height={11} fill="#f8fafc" rx="1" />
            <rect x={358} y={403 + off} width={11} height={4} fill="#f8fafc" rx="1" />
            <rect x={431} y={403 + off} width={11} height={4} fill="#f8fafc" rx="1" />
          </g>
        ))}

        {/* ======= STOPLINES (matching vehicleEngine.ts) ======= */}
        {/* J1: North y=100, South y=200, West x=345, East x=455 */}
        <line x1="370" y1="100" x2="430" y2="100" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="370" y1="200" x2="430" y2="200" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="345" y1="120" x2="345" y2="180" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="455" y1="120" x2="455" y2="180" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        {/* J2: North (link) y=380, South y=480, West x=345, East x=455 */}
        <line x1="370" y1="380" x2="430" y2="380" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="370" y1="480" x2="430" y2="480" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="345" y1="400" x2="345" y2="460" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />
        <line x1="455" y1="400" x2="455" y2="460" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" opacity="0.75" />

        {/* ======= DIRECTIONAL ARROWS ======= */}
        <g opacity="0.3" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M 210 135 L 230 135 L 225 130 M 230 135 L 225 140" />
          <path d="M 590 165 L 570 165 L 575 160 M 570 165 L 575 170" />
          <path d="M 383 295 L 383 315 L 378 310 M 383 315 L 388 310" />
          <path d="M 417 330 L 417 310 L 412 315 M 417 310 L 422 315" />
          <path d="M 210 415 L 230 415 L 225 410 M 230 415 L 225 420" />
          <path d="M 590 445 L 570 445 L 575 440 M 570 445 L 575 450" />
        </g>

        {/* ======= VEHICLES ======= */}
        {vehicles.map((v) => {
          const isTruck = v.type === 'truck';
          const isBus = v.type === 'bus';
          const isHorizontal = v.lane.includes('WEST') || v.lane.includes('EAST');
          // Width along travel axis, height perpendicular
          const w = isHorizontal ? (isTruck ? 22 : isBus ? 20 : 15) : (isTruck ? 11 : isBus ? 10 : 8);
          const h = isHorizontal ? (isTruck ? 11 : isBus ? 10 : 8) : (isTruck ? 22 : isBus ? 20 : 15);

          // Headlight: in front of vehicle
          let hlDx = 0, hlDy = 0;
          if (v.lane === 'I1_NORTH' || v.lane === 'LINK_DOWN') { hlDy = h / 2 + 5; }
          else if (v.lane === 'I2_SOUTH' || v.lane === 'LINK_UP') { hlDy = -(h / 2 + 5); }
          else if (v.lane === 'I1_WEST' || v.lane === 'I2_WEST') { hlDx = w / 2 + 5; }
          else { hlDx = -(w / 2 + 5); }

          // Brake light: at the rear
          let blDx = 0, blDy = 0;
          if (v.lane === 'I1_NORTH' || v.lane === 'LINK_DOWN') { blDy = -(h / 2); }
          else if (v.lane === 'I2_SOUTH' || v.lane === 'LINK_UP') { blDy = h / 2; }
          else if (v.lane === 'I1_WEST' || v.lane === 'I2_WEST') { blDx = -(w / 2); }
          else { blDx = w / 2; }

          return (
            <g key={v.id}>
              {!v.stopped && (
                <ellipse
                  cx={v.x + hlDx} cy={v.y + hlDy}
                  rx={isHorizontal ? 8 : 4} ry={isHorizontal ? 4 : 8}
                  fill="#fef08a" opacity="0.18" filter="url(#headlightGlow)"
                />
              )}
              {/* Shadow */}
              <rect x={v.x - w / 2 + 1} y={v.y - h / 2 + 1} width={w} height={h} rx="3" fill="#000" opacity="0.5" />
              {/* Body */}
              <rect x={v.x - w / 2} y={v.y - h / 2} width={w} height={h} rx="3" fill={v.color} stroke="#030712" strokeWidth="1.2" />
              {/* Windshield */}
              <rect x={v.x - w / 4} y={v.y - h / 4} width={w / 2} height={h / 2} rx="1" fill="#0f172a" opacity="0.6" />
              {/* Brake lights */}
              {v.stopped && (
                <circle cx={v.x + blDx} cy={v.y + blDy} r="2.5" fill="#ef4444" filter="url(#redGlow)" />
              )}
            </g>
          );
        })}

        {/* ======= SIGNAL UNITS ======= */}
        {/* J1 — top-right of intersection */}
        <g transform="translate(460, 42)">
          <rect width="200" height="56" rx="10" fill="#030712" stroke="#06b6d4" strokeWidth="1.5" opacity="0.95" />
          <text x="100" y="16" fill="#38bdf8" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono" textAnchor="middle">JUNCTION 1 (NORTH HUB)</text>
          <circle cx="28" cy="37" r="7"
            fill={signal1.nsLight === 'GREEN' ? '#10b981' : signal1.nsLight === 'YELLOW' ? '#f59e0b' : '#ef4444'}
            filter={signal1.nsLight === 'GREEN' ? 'url(#greenGlow)' : signal1.nsLight === 'YELLOW' ? 'url(#yellowGlow)' : 'url(#redGlow)'}
          />
          <text x="44" y="41" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
            {'N-S: '}{signal1.nsLight === 'GREEN' ? `GRN ${signal1.countdown.toFixed(0)}s` : signal1.nsLight}
          </text>
          <circle cx="124" cy="37" r="7"
            fill={signal1.ewLight === 'GREEN' ? '#10b981' : signal1.ewLight === 'YELLOW' ? '#f59e0b' : '#ef4444'}
            filter={signal1.ewLight === 'GREEN' ? 'url(#greenGlow)' : signal1.ewLight === 'YELLOW' ? 'url(#yellowGlow)' : 'url(#redGlow)'}
          />
          <text x="140" y="41" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
            {'E-W: '}{signal1.ewLight === 'GREEN' ? `GRN ${signal1.countdown.toFixed(0)}s` : signal1.ewLight}
          </text>
        </g>

        {/* J2 — above J2 intersection */}
        <g transform="translate(460, 340)">
          <rect width="200" height="56" rx="10" fill="#030712" stroke="#8b5cf6" strokeWidth="1.5" opacity="0.95" />
          <text x="100" y="16" fill="#c084fc" fontSize="11" fontWeight="800" fontFamily="JetBrains Mono" textAnchor="middle">JUNCTION 2 (SOUTH HUB)</text>
          <circle cx="28" cy="37" r="7"
            fill={signal2.nsLight === 'GREEN' ? '#10b981' : signal2.nsLight === 'YELLOW' ? '#f59e0b' : '#ef4444'}
            filter={signal2.nsLight === 'GREEN' ? 'url(#greenGlow)' : signal2.nsLight === 'YELLOW' ? 'url(#yellowGlow)' : 'url(#redGlow)'}
          />
          <text x="44" y="41" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
            {'N-S: '}{signal2.nsLight === 'GREEN' ? `GRN ${signal2.countdown.toFixed(0)}s` : signal2.nsLight}
          </text>
          <circle cx="124" cy="37" r="7"
            fill={signal2.ewLight === 'GREEN' ? '#10b981' : signal2.ewLight === 'YELLOW' ? '#f59e0b' : '#ef4444'}
            filter={signal2.ewLight === 'GREEN' ? 'url(#greenGlow)' : signal2.ewLight === 'YELLOW' ? 'url(#yellowGlow)' : 'url(#redGlow)'}
          />
          <text x="140" y="41" fill="#f8fafc" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">
            {'E-W: '}{signal2.ewLight === 'GREEN' ? `GRN ${signal2.countdown.toFixed(0)}s` : signal2.ewLight}
          </text>
        </g>

        {/* Inter-junction link label */}
        <g transform="translate(155, 282)">
          <rect width="195" height="28" rx="6" fill="#030712" stroke="#334155" strokeWidth="1" opacity="0.9" />
          <text x="97" y="18" fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold" textAnchor="middle">
            ↕ INTER-JUNCTION LINK
          </text>
        </g>
      </svg>
    </div>
  );
}
