import React from 'react';
import { useApp } from '../../hooks/useAppState';
import { SmartCitySimulation } from '../simulation/SmartCitySimulation';
import {
  Zap, Ambulance, Clock, Activity, Gauge, Flame,
  Minimize2, CheckCircle2, TrendingDown, TrendingUp
} from 'lucide-react';

export function PresentationView() {
  const { state, dispatch } = useApp();

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 flex flex-col p-6 overflow-hidden select-none">
      {/* Top Presentation Header */}
      <header className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white text-base shadow-xs">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                QUANTUM TRAFFIC OPTIMIZATION
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
                Projector Presentation Mode
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Smarter Signals • Safer Roads • Greener Cities
            </p>
          </div>
        </div>

        {/* Live Badges & Exit Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>System Online</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-700">
            <Zap size={13} />
            <span>QUBO + QAOA Active</span>
          </div>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition shadow-xs"
          >
            <Minimize2 size={14} /> Exit Presentation
          </button>
        </div>
      </header>

      {/* Main Fullscreen Presentation Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
        {/* Left: Large Simulation (70% width) */}
        <div className="flex-1 flex flex-col min-h-0">
          <SmartCitySimulation />
        </div>

        {/* Right: Key Presentation Metrics (30% width) */}
        <div className="w-full lg:w-80 flex flex-col gap-3.5 overflow-y-auto">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium mb-1">Average Waiting Time</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">12.4 s</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown size={13} /> ↓ 42% vs Classical Fixed
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium mb-1">Average Queue Length</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">8 veh</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown size={13} /> ↓ 38% vs Classical Fixed
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium mb-1">Traffic Throughput</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">1,240 v/h</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp size={13} /> ↑ 28% vs Classical Fixed
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium mb-1">Emergency Travel Time</div>
            <div className="text-3xl font-bold text-slate-900 tracking-tight">1.8 min</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown size={13} /> ↓ 64% Green Wave Preemption
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs space-y-1.5">
            <div className="font-bold text-teal-900">Presentation Summary:</div>
            <p className="text-teal-700 leading-relaxed">
              QUBO/QAOA optimizes split intervals across 4 interconnected junctions, preventing arterial spillback and guaranteeing pre-emptive green corridors for emergency responders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
