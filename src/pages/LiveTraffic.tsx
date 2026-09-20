import React from 'react';
import { useApp } from '../hooks/useAppState';
import { NetworkMap } from '../components/network/NetworkMap';
import { PageHeader } from '../components/common/PageHeader';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import { getDensityColor, getSignalColor } from '../utils/helpers';
import {
  Activity, Zap, Sliders, Play, Pause, RotateCcw
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area
} from 'recharts';

export function LiveTraffic() {
  const { state, dispatch } = useApp();
  const isQuantum = state.activeMode === 'quantum';
  const history = state.metricHistory.slice(-25);

  return (
    <PageContainer>
      {/* ── HEADER BANNER & CONTROLS ── */}
      <PageHeader
        icon={Activity}
        title="Live Traffic Network"
        subtitle="Nodes J1–J6 • Real-time Microscopic Network Topology & Adaptive Phase Actuation"
        actions={
          <>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs">
              <button
                onClick={() => dispatch({ type: 'SET_PAUSED', paused: !state.isPaused })}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  state.isPaused ? 'bg-teal-600 text-white shadow-2xs' : 'bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {state.isPaused ? <Play size={13} /> : <Pause size={13} />}
                {state.isPaused ? 'Start' : 'Pause'}
              </button>
              <button
                onClick={() => dispatch({ type: 'RESET_SIMULATION' })}
                className="px-3 py-1.5 rounded-lg bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90 font-semibold cursor-pointer"
              >
                <RotateCcw size={12} className="inline mr-1" /> Reset
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1" />

              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => dispatch({ type: 'SET_SPEED', speed: spd })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer ${
                    state.simSpeed === spd ? 'bg-teal-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs">
              <button
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'classical' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  !isQuantum
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Classical Fixed
              </button>
              <button
                onClick={() => dispatch({ type: 'SET_MODE', mode: 'quantum' })}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isQuantum
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                <Zap size={13} /> Quantum QAOA
              </button>
            </div>
          </>
        }
      />

      {/* Mode Explanation Alert */}
      <div
        className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
          isQuantum
            ? 'bg-purple-50/80 border-purple-200 text-purple-900'
            : 'bg-teal-50/80 border-teal-200 text-teal-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isQuantum ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'}`}>
            {isQuantum ? <Zap size={18} /> : <Sliders size={18} />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">
              {isQuantum
                ? 'Active: QAOA Hybrid Adaptive Optimization (J1–J6)'
                : 'Active: Fixed-Time Round Robin Controller'}
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isQuantum
                ? 'QAOA continuously recalculates green phase allocation dynamically based on real-time queue length & spillback risk across all 6 junctions.'
                : 'Signals cycle rigidly through fixed 30s green / 5s yellow / 25s red without anticipating incoming vehicle arrivals.'}
            </p>
          </div>
        </div>
        <span className="font-bold text-[11px] px-3 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
          {isQuantum ? 'Opt Gain: +34% Capacity' : 'Baseline: Fixed'}
        </span>
      </div>

      {/* ── MAIN 70% LEFT / 30% RIGHT LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] gap-6 items-start">
        {/* LEFT 70%: Large SVG/Canvas Network Topology */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
              Network Mesh Topology (Nodes J1–J6)
            </h2>
            <span className="text-[11px] text-slate-400 font-mono">SVG Interactive Canvas</span>
          </div>

          <div className="w-full min-h-[460px]">
            <NetworkMap height={460} mode={state.activeMode} />
          </div>
        </div>

        {/* RIGHT 30%: Real-Time Telemetry Metrics */}
        <div className="space-y-5">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Avg Waiting Time</span>
              <span className="text-teal-700 font-extrabold text-sm">{state.traffic.avgWaitingTime.toFixed(1)}s</span>
            </h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="waitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} width={25} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="waitingTime" stroke="#0d9488" strokeWidth={2} fill="url(#waitGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Network Throughput</span>
              <span className="text-purple-700 font-extrabold text-sm">{state.traffic.totalThroughput.toFixed(0)} veh/min</span>
            </h4>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="thruGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} stroke="#94a3b8" fontSize={10} width={25} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="throughput" stroke="#7c3aed" strokeWidth={2} fill="url(#thruGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ── DETAILED INTERSECTION STATUS MATRIX (J1–J6) ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
          <span>Live Intersection Status Matrix (J1–J6)</span>
          <span className="text-[11px] text-slate-400 font-normal">Real-Time Synchronized</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {Object.values(state.traffic.intersections).map((node) => {
            const densityColor = getDensityColor(node.density);
            const signalColor = getSignalColor(node.signal);

            return (
              <div
                key={node.id}
                onClick={() => dispatch({ type: 'SELECT_INTERSECTION', id: node.id })}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 hover:border-teal-500/50 cursor-pointer transition-all hover:bg-white hover:shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900">{node.id}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: signalColor }} />
                    <span className="text-[10px] uppercase text-slate-600 font-semibold">{node.signal}</span>
                  </div>
                </div>

                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-500">Density</span>
                    <span style={{ color: densityColor }} className="font-semibold">{node.density.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${node.density}%`, backgroundColor: densityColor }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 border-t border-slate-200/80 pt-2 font-mono">
                  <div>Queue: <span className="text-slate-900 font-bold">{node.queueLength}</span></div>
                  <div>Wait: <span className="text-slate-900 font-bold">{node.waitingTime.toFixed(0)}s</span></div>
                  <div className="col-span-2 text-teal-700 font-medium mt-0.5">
                    ⏱ {node.signalCountdown.toFixed(0)}s left (Phase {node.phase})
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
