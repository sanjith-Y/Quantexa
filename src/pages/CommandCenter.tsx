import React, { useState } from 'react';
import { useApp } from '../hooks/useAppState';
import { PageHeader } from '../components/common/PageHeader';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import { KpiCard } from '../components/common/KpiCard';
import { DataRow } from '../components/common/DataRow';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  SmartCitySimulation,
  IntersectionInfo,
  SimMode
} from '../components/simulation/SmartCitySimulation';
import {
  Clock,
  Gauge,
  Activity,
  Flame,
  Fuel,
  Ambulance,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  Zap,
  Shield,
  Layers,
  Play
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

export function CommandCenter() {
  const { state, dispatch } = useApp();

  // Metrics received from SmartCitySimulation
  const [metrics, setMetrics] = useState({
    avgWait: 10.8,
    queueLen: 8,
    throughput: 1240,
    co2: 74.2,
    fuel: 31.5,
    emergencyEta: 1.8,
    activeMode: 'quantum' as SimMode,
    totalVehicles: 34,
    intersections: [] as IntersectionInfo[],
  });

  // Delay comparison historical data
  const comparisonData = [
    { time: '00:00', classicalWait: 22, quantumWait: 20 },
    { time: '00:30', classicalWait: 26, quantumWait: 18 },
    { time: '01:00', classicalWait: 31, quantumWait: 15 },
    { time: '01:30', classicalWait: 35, quantumWait: 14 },
    { time: '02:00', classicalWait: 38, quantumWait: 12 },
    { time: '02:30', classicalWait: 41, quantumWait: metrics.avgWait },
  ];

  return (
    <PageContainer>
      {/* ── UNIFIED PAGE HEADER ── */}
      <PageHeader
        icon={Play}
        title="Quantum Traffic Simulation Network"
        subtitle="Interactive Microscopic Vehicle Simulation, Adaptive Signal Routing & QAOA Optimization"
        badge={{ text: 'Microscopic Engine Active', variant: 'teal' }}
      />

      {/* ── STEP 2 & 7: MASTER LAYOUT (CSS Grid: Center minmax(0, 1fr) + Right Operations Panel 340px) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-4 items-start w-full min-w-0">
        {/* CENTER COLUMN: SIMULATION WORKSPACE + PERFORMANCE METRICS BELOW IT */}
        <div className="min-w-0 w-full space-y-4">
          {/* STEP 8: SIMULATION HERO PANEL */}
          <SmartCitySimulation onMetricsUpdate={setMetrics} />

          {/* STEP 24 & 25: PERFORMANCE METRICS SECTION (Below Simulation Workspace) */}
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Gauge size={18} className="text-teal-600" />
                  KEY PERFORMANCE METRICS
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Live telemetry compared with classical fixed-timing baseline
                </p>
              </div>
              <StatusBadge variant="slate">
                Telemetry Updated: Live
              </StatusBadge>
            </div>

            {/* STEP 24: 3-Column Equal Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KpiCard
                title="Average Waiting Time"
                icon={Clock}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                value={metrics.avgWait}
                unit="seconds"
                badgeText="↓ 42% vs Classical"
                badgeIcon={TrendingDown}
                badgeVariant="emerald"
              />
              <KpiCard
                title="Average Queue Length"
                icon={Layers}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                value={metrics.queueLen}
                unit="vehicles"
                badgeText="↓ 38% vs Classical"
                badgeIcon={TrendingDown}
                badgeVariant="emerald"
              />
              <KpiCard
                title="Traffic Throughput"
                icon={Activity}
                iconBg="bg-teal-50"
                iconColor="text-teal-600"
                value={metrics.throughput.toLocaleString()}
                unit="veh / hr"
                badgeText="↑ 28% vs Classical"
                badgeIcon={TrendingUp}
                badgeVariant="emerald"
              />
              <KpiCard
                title="Fuel Consumption"
                icon={Fuel}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                value={metrics.fuel}
                unit="L / hr"
                badgeText="↓ 22% vs Classical"
                badgeIcon={TrendingDown}
                badgeVariant="emerald"
              />
              <KpiCard
                title="CO₂ Emissions"
                icon={Flame}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                value={metrics.co2}
                unit="kg / hr"
                badgeText="↓ 25% vs Classical"
                badgeIcon={TrendingDown}
                badgeVariant="emerald"
              />
              <KpiCard
                title="Emergency Travel Time"
                icon={Ambulance}
                iconBg="bg-rose-50"
                iconColor="text-rose-600"
                value={metrics.emergencyEta}
                unit="min (J1 → J4)"
                badgeText="↓ 64% vs Classical"
                badgeIcon={TrendingDown}
                badgeVariant="emerald"
              />
            </div>

            {/* Traffic Flow Comparison Chart */}
            <Card className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Traffic Flow Comparison • Classical vs Quantum
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Intersection average waiting time (seconds) recorded across continuous simulation intervals
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400" />
                    <span className="text-slate-600">Classical (Fixed Timing)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-teal-600" />
                    <span className="text-teal-700 font-semibold">Quantum Optimized (QUBO)</span>
                  </div>
                </div>
              </div>

              <div className="h-60 w-full pt-1 min-w-0 overflow-hidden">
                <ResponsiveContainer width="99%" height="100%">
                  <AreaChart data={comparisonData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClassical" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorQuantum" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorClassical)"
                    />
                    <Area
                      type="monotone"
                      dataKey="quantumWait"
                      name="Quantum Optimized"
                      stroke="#0d9488"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorQuantum)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>

        {/* STEP 19: RIGHT OPERATIONS PANEL (Strict 340px Column) */}
        <div className="w-full lg:w-[340px] flex-shrink-0 space-y-3 min-w-0">
          {/* STEP 20: SIMULATION STATUS (Strict 2-Column Grid: 40% 60%) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Gauge size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Simulation Status
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-[40%_60%] items-center">
                <span className="text-slate-500 font-medium">Current Mode</span>
                <span className="text-right font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                  {metrics.activeMode === 'quantum' ? 'Quantum Optimized' : 'Classical Fixed'}
                </span>
              </div>

              <div className="grid grid-cols-[40%_60%] items-center">
                <span className="text-slate-500 font-medium">Time Elapsed</span>
                <span className="text-right font-mono font-bold text-slate-900 text-xs">
                  32:59
                </span>
              </div>

              <div className="grid grid-cols-[40%_60%] items-center">
                <span className="text-slate-500 font-medium">Total Vehicles</span>
                <span className="text-right font-mono font-bold text-slate-900 text-xs">
                  {metrics.totalVehicles} active
                </span>
              </div>

              <div className="grid grid-cols-[40%_60%] items-center">
                <span className="text-slate-500 font-medium">Active Events</span>
                <span className="text-right font-semibold text-teal-700 flex items-center justify-end gap-1 text-xs">
                  <CheckCircle2 size={13} className="text-teal-600 flex-shrink-0" />
                  <span>1 Emergency Corridor</span>
                </span>
              </div>
            </div>
          </div>

          {/* STEP 21: RECENT EVENTS (Row 1: Title + time right aligned, Row 2: description) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Activity size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Recent Events
                </h3>
              </div>
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                3 Recorded
              </span>
            </div>

            <div className="space-y-2">
              {/* Event 1 */}
              <div className="p-2.5 rounded-lg bg-rose-50/80 border border-rose-200 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-rose-600 flex-shrink-0 animate-ping" />
                    <span className="text-xs font-bold text-rose-900 truncate">Emergency Vehicle Detected</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-rose-500 flex-shrink-0">
                    00:35
                  </span>
                </div>
                <p className="text-[11px] text-rose-700 pl-3.5 leading-snug">
                  Ambulance at Junction 1 → Destination
                </p>
              </div>

              {/* Event 2 */}
              <div className="p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-amber-900 truncate">Traffic Density Increase</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-amber-600 flex-shrink-0">
                    00:40
                  </span>
                </div>
                <p className="text-[11px] text-amber-700 pl-3.5 leading-snug">
                  Junction 3 — North Road Surge
                </p>
              </div>

              {/* Event 3 */}
              <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="text-xs font-bold text-blue-900 truncate">Optimization Plan Applied</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-blue-500 flex-shrink-0">
                    00:44
                  </span>
                </div>
                <p className="text-[11px] text-blue-700 pl-3.5 leading-snug">
                  QUBO dynamic green wave active J1→J4
                </p>
              </div>
            </div>
          </div>

          {/* STEP 22: SYSTEM LOGS (Strict 2-Column Grid: 1fr auto) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Terminal size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  System Logs
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono font-medium text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                Live Stream
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="grid grid-cols-[1fr_auto] items-center text-slate-700">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 flex-shrink-0" />
                  <span className="truncate">QUBO model constructed</span>
                </span>
                <span className="text-slate-400 font-bold ml-2">00:42</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center text-slate-700">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
                  <span className="truncate">QAOA optimization completed</span>
                </span>
                <span className="text-slate-400 font-bold ml-2">00:43</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center text-slate-700">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="truncate">Signal timings updated</span>
                </span>
                <span className="text-slate-400 font-bold ml-2">00:44</span>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center text-slate-700">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="truncate">Simulation running (60 FPS)</span>
                </span>
                <span className="text-slate-400 font-bold ml-2">00:45</span>
              </div>
            </div>
          </div>

          {/* STEP 23: SIGNAL STATUS (Strict CSS Grid Table: 1.2fr 1.4fr 1.4fr) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Shield size={14} />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Signal Status
                </h3>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-700">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                Phase Active
              </span>
            </div>

            <div className="w-full text-xs font-medium min-w-0 max-w-full">
              {/* Table Header Grid */}
              <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 border-b border-slate-200 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span className="text-left">Node</span>
                <span className="text-left">Current</span>
                <span className="text-right">Optimized</span>
              </div>

              {/* Table Rows Grid */}
              <div className="divide-y divide-slate-100 text-[11px]">
                <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 items-center py-2 px-0.5 min-w-0">
                  <span className="font-bold text-slate-800 text-left truncate">J1</span>
                  <span className="font-semibold text-rose-600 text-left truncate">Red → Grn</span>
                  <span className="text-right font-bold text-emerald-700 truncate font-mono">Grn (24s)</span>
                </div>
                <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 items-center py-2 px-0.5 min-w-0">
                  <span className="font-bold text-slate-800 text-left truncate">J2</span>
                  <span className="font-semibold text-emerald-600 text-left truncate">Grn → Grn</span>
                  <span className="text-right font-bold text-emerald-700 truncate font-mono">Grn (32s)</span>
                </div>
                <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 items-center py-2 px-0.5 min-w-0">
                  <span className="font-bold text-slate-800 text-left truncate">J3</span>
                  <span className="font-semibold text-rose-600 text-left truncate">Red → Grn</span>
                  <span className="text-right font-bold text-emerald-700 truncate font-mono">Grn (20s)</span>
                </div>
                <div className="grid grid-cols-[56px_minmax(0,1fr)_90px] gap-2 items-center py-2 px-0.5 min-w-0">
                  <span className="font-bold text-slate-800 text-left truncate">J4</span>
                  <span className="font-semibold text-emerald-600 text-left truncate">Grn → Grn</span>
                  <span className="text-right font-bold text-emerald-700 truncate font-mono">Grn (28s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
