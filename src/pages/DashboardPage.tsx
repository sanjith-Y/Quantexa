import React, { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import { NetworkMap } from '../components/network/NetworkMap';
import { PageHeader } from '../components/common/PageHeader';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import { KpiCard } from '../components/common/KpiCard';
import { DataRow } from '../components/common/DataRow';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  LayoutDashboard, Activity, Gauge, Clock, TrendingDown, TrendingUp,
  Fuel, Flame, Ambulance, Zap, Shield, CheckCircle2, Terminal
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

export function DashboardPage() {
  const { state, dispatch } = useApp();
  const waitTime = state.traffic.avgWaitingTime || 10.8;
  const isQuantum = state.activeMode === 'quantum';
  const emergency = state.emergency;

  // Comparison Historical Data
  const comparisonData = [
    { time: '00:00', classicalWait: 22, quantumWait: 20, throughput: 1100 },
    { time: '00:30', classicalWait: 26, quantumWait: 18, throughput: 1220 },
    { time: '01:00', classicalWait: 31, quantumWait: 15, throughput: 1350 },
    { time: '01:30', classicalWait: 35, quantumWait: 14, throughput: 1420 },
    { time: '02:00', classicalWait: 38, quantumWait: 12, throughput: 1480 },
    { time: '02:30', classicalWait: 41, quantumWait: Number(waitTime.toFixed(1)), throughput: Math.round(state.traffic.totalThroughput) },
  ];

  const handleToggleMode = (newMode: 'classical' | 'quantum') => {
    dispatch({ type: 'SET_MODE', mode: newMode });
  };

  const handleDeployAmbulance = () => {
    if (emergency.active) {
      dispatch({ type: 'END_EMERGENCY' });
    } else {
      dispatch({ type: 'START_EMERGENCY' });
    }
  };

  return (
    <PageContainer>
      <PageHeader
        icon={LayoutDashboard}
        title="Executive Traffic Command Dashboard"
        subtitle="Autonomous AI Signal Orchestration • Real-Time Telemetry & QAOA Optimization"
        actions={
          <>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/90 text-xs">
              <button
                onClick={() => handleToggleMode('classical')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  !isQuantum ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock size={13} className={!isQuantum ? 'text-slate-700' : 'text-slate-400'} />
                <span>Classical Fixed</span>
              </button>
              <button
                onClick={() => handleToggleMode('quantum')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                  isQuantum ? 'bg-purple-600 text-white shadow-2xs' : 'text-purple-700 hover:text-purple-900'
                }`}
              >
                <Zap size={13} className={isQuantum ? 'text-amber-300 animate-pulse' : 'text-purple-500'} />
                <span>Quantum QAOA</span>
              </button>
            </div>

            <button
              onClick={handleDeployAmbulance}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition shadow-2xs cursor-pointer ${
                emergency.active
                  ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              <Ambulance size={15} />
              <span>{emergency.active ? 'Corridor Active (AMB-001)' : 'Deploy Emergency Corridor'}</span>
            </button>
          </>
        }
      />

      {/* ── 2. KEY PERFORMANCE METRICS GRID (6 EQUAL-HEIGHT CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-4">
        <KpiCard
          title="Congestion Index"
          icon={Gauge}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value="28.4%"
          subValue="Optimal"
          badgeText="↓ 42% vs Baseline"
          badgeIcon={TrendingDown}
          badgeVariant="emerald"
        />
        <KpiCard
          title="Average Delay"
          icon={Clock}
          iconBg="bg-teal-50"
          iconColor="text-teal-600"
          value={waitTime.toFixed(1)}
          unit="sec"
          badgeText="↓ 38.2% less delay"
          badgeIcon={TrendingDown}
          badgeVariant="emerald"
        />
        <KpiCard
          title="Throughput"
          icon={Activity}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          value={Math.round(state.traffic.totalThroughput).toLocaleString()}
          unit="veh / hr"
          badgeText="↑ 28% capacity"
          badgeIcon={TrendingUp}
          badgeVariant="emerald"
        />
        <KpiCard
          title="Fuel Consumed"
          icon={Fuel}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          value="31.5"
          unit="L / hr"
          badgeText="↓ 22% fuel cuts"
          badgeIcon={TrendingDown}
          badgeVariant="emerald"
        />
        <KpiCard
          title="CO₂ Cut Rate"
          icon={Flame}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          value="74.2"
          unit="kg / hr"
          badgeText="↓ 25% emissions"
          badgeIcon={TrendingDown}
          badgeVariant="emerald"
        />
        <KpiCard
          title="Emergency ETA"
          icon={Ambulance}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
          value="1.8"
          unit="min"
          badgeText="↓ 64% travel time"
          badgeIcon={TrendingDown}
          badgeVariant="emerald"
        />
      </div>

      {/* ── 3. MAIN DASHBOARD CONTENT: TOPOLOGY MAP + REAL-TIME PERFORMANCE ANALYTICS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6 items-stretch">
        {/* LEFT COLUMN: Live Network Topology */}
        <Card className="flex flex-col justify-between h-full space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
                <Activity size={14} />
              </div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Live Network Topology & Intersection Status
              </h2>
            </div>
            <StatusBadge variant="emerald" pulse>
              Real-Time Synchronized
            </StatusBadge>
          </div>

          <div className="flex-1 min-h-[380px]">
            <NetworkMap height={380} mode={state.activeMode} showEmergency={emergency.active} />
          </div>
        </Card>

        {/* RIGHT COLUMN: Engine Telemetry + Signal Status + Event Logs */}
        <div className="flex flex-col justify-between h-full space-y-4">
          {/* Engine Telemetry */}
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Gauge size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Engine Telemetry
                </h3>
              </div>
              <StatusBadge variant="emerald" pulse>
                Live 60 FPS
              </StatusBadge>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              <DataRow
                label="Control Mode"
                value={
                  <span className="text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 text-[11px]">
                    {isQuantum ? 'QAOA Hybrid' : 'Classical Fixed'}
                  </span>
                }
              />
              <DataRow
                label="Active Vehicles"
                value={`${state.traffic.totalThroughput > 0 ? Math.round(state.traffic.totalThroughput / 35) : 34} active`}
              />
              <DataRow
                label="Emergency Status"
                value={
                  <span className="text-teal-700 flex items-center justify-end gap-1 text-[11px]">
                    <CheckCircle2 size={13} className="text-teal-600 flex-shrink-0" />
                    <span>{emergency.active ? 'Corridor Active' : 'Standby Ready'}</span>
                  </span>
                }
              />
            </div>
          </Card>

          {/* Intersection Signal Status Matrix (J1–J6) */}
          <Card className="space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Shield size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Signal Status Matrix
                </h3>
              </div>
              <StatusBadge variant="teal">
                Phase Active
              </StatusBadge>
            </div>

            <div className="w-full min-w-0 max-w-full space-y-1 text-xs">
              <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 py-1.5 px-1 border-b border-slate-100 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                <span className="text-left">Node</span>
                <span className="text-left">State</span>
                <span className="text-right">Timer</span>
              </div>
              <div className="divide-y divide-slate-100 font-medium text-[11px]">
                {Object.values(state.traffic.intersections).map((node) => (
                  <div key={node.id} className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 py-2 px-1 items-center min-w-0 w-full">
                    <span className="text-slate-800 font-bold truncate text-left">{node.id}</span>
                    <span className="inline-flex items-center gap-1.5 min-w-0 truncate text-left">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          node.signal === 'green' ? 'bg-emerald-500' : node.signal === 'yellow' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                      <span className="capitalize text-slate-700 truncate">{node.signal}</span>
                    </span>
                    <span className="text-right text-emerald-700 font-bold truncate font-mono tabular-nums">
                      {node.signalCountdown.toFixed(0)}s left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Live Incident & Event Log Stream */}
          <Card className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Terminal size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Recent Log Stream
                </h3>
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400">
                Live Feed
              </span>
            </div>

            <div className="space-y-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-rose-50/70 border border-rose-200 flex items-center justify-between text-rose-900">
                <span className="truncate">🚑 AMB-001 Emergency Route Pre-cleared</span>
                <span className="text-rose-500 font-bold ml-2">00:35</span>
              </div>
              <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-200 flex items-center justify-between text-teal-900">
                <span className="truncate">⚛ QAOA Circuit Converged (1,024 shots)</span>
                <span className="text-teal-600 font-bold ml-2">00:42</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── 4. TRAFFIC DELAY BENCHMARK CHART (FIXED 280PX HEIGHT) ── */}
      <Card className="space-y-4 p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Traffic Delay Benchmark • Classical vs Quantum QAOA
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Average waiting time (seconds) recorded across continuous simulation intervals
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-400" />
              <span className="text-slate-600">Classical (Fixed 30s)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600" />
              <span className="text-teal-700 font-semibold">Quantum Optimized (QUBO)</span>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={comparisonData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="dashClassical" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="dashQuantum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit="s" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: 8, fontSize: 12, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area
                type="monotone"
                dataKey="classicalWait"
                name="Classical Fixed"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#dashClassical)"
              />
              <Area
                type="monotone"
                dataKey="quantumWait"
                name="Quantum Optimized"
                stroke="#0d9488"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#dashQuantum)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </PageContainer>
  );
}
