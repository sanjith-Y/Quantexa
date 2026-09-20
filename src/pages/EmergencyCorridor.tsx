import React from 'react';
import { useApp } from '../hooks/useAppState';
import { NetworkMap } from '../components/network/NetworkMap';
import { PageHeader } from '../components/common/PageHeader';
import { PageContainer } from '../components/common/PageContainer';
import { Card } from '../components/common/Card';
import {
  Ambulance, Zap, RotateCcw, Clock,
  MapPin, CheckCircle2, ArrowRight, Activity, ChevronRight
} from 'lucide-react';

export function EmergencyCorridor() {
  const { state, dispatch } = useApp();
  const emergency = state.emergency;
  const isEmergencyActive = emergency.active;

  const handleDeploy = () => {
    dispatch({ type: 'START_EMERGENCY' });
  };

  const handleEnd = () => {
    dispatch({ type: 'END_EMERGENCY' });
  };

  const handleAdvance = () => {
    dispatch({ type: 'ADVANCE_EMERGENCY' });
  };

  return (
    <PageContainer>
      {/* ── HEADER BANNER ── */}
      <PageHeader
        icon={Ambulance}
        iconColor="text-rose-600"
        title="Emergency Green Corridor"
        subtitle="Dynamic Signal Preemption & Automated Green Wave Actuation Along Emergency Route"
        badge={{
          text: isEmergencyActive ? 'CORRIDOR ACTIVE' : 'Standby Mode',
          variant: isEmergencyActive ? 'rose' : 'slate',
        }}
        actions={
          !isEmergencyActive ? (
            <button
              onClick={handleDeploy}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-2xs flex items-center gap-2 transition cursor-pointer"
            >
              <Ambulance size={15} /> Deploy Emergency (AMB-001)
            </button>
          ) : (
            <>
              <button
                onClick={handleAdvance}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                Advance Vehicle <ChevronRight size={14} />
              </button>
              <button
                onClick={handleEnd}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
              >
                <RotateCcw size={14} /> Clear Corridor
              </button>
            </>
          )
        }
      />

      {/* ── EMERGENCY ALERT BANNER ── */}
      {isEmergencyActive ? (
        <div className="p-4 rounded-xl bg-rose-50/80 border border-rose-200/90 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
            <div>
              <div className="font-extrabold text-rose-900 text-sm">
                🚑 Emergency Vehicle Detected • Ambulance En Route
              </div>
              <div className="text-rose-700 text-xs font-medium mt-0.5">
                Dynamic signals pre-cleared along corridor: Junction 1 → Junction 2 → Junction 3 → Junction 4
              </div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200 shadow-2xs">
            ETA: 1.8 min
          </span>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 flex items-center justify-between text-xs shadow-2xs">
          <div className="flex items-center gap-2.5 text-slate-700 font-medium">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>Emergency Mode Standby — System ready to deploy instant green wave upon vehicle detection.</span>
          </div>
          <span className="text-slate-400 font-mono text-xs font-bold">Standby Ready</span>
        </div>
      )}

      {/* ── HORIZONTAL ROUTE TIMELINE CARDS (J1 -> J2 -> J3 -> J4) ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>Emergency Corridor Route Timeline</span>
          <span className="text-[11px] text-slate-400 font-normal">Route Segment Status</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { id: 'J1', name: 'J1', status: 'Pre-Cleared', desc: 'Entry Hub', active: true },
            { id: '2', name: 'J2', status: 'Green Wave', desc: 'Connecting Artery', active: isEmergencyActive },
            { id: '3', name: 'J3', status: 'Signal Locked', desc: 'Midpoint Transit', active: isEmergencyActive },
            { id: '4', name: 'J4', status: 'Destination', desc: 'Hospital Arterial', active: isEmergencyActive },
          ].map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border flex flex-col justify-between h-[100px] ${
                item.active
                  ? 'bg-teal-50/80 border-teal-300 text-teal-900 shadow-2xs'
                  : 'bg-slate-50 border-slate-200/90 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-base text-slate-900">{item.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.active ? 'bg-white border border-teal-200 text-teal-800' : 'bg-slate-200 text-slate-600'}`}>
                  {item.status}
                </span>
              </div>
              <div className="text-xs text-slate-500 font-medium">{item.desc}</div>
              {idx < 3 && (
                <div className="text-right text-teal-600 text-xs font-bold">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 2-COLUMN MAIN ROUTE VISUALIZATION (70% MAP / 30% TELEMETRY) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] gap-6 items-start">
        {/* LEFT 70%: Emergency Route Map */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              Live Emergency Corridor Topology Map
            </h3>
            <span className="text-xs text-slate-400 font-mono font-medium">Corridor Active</span>
          </div>

          <div className="w-full min-h-[420px]">
            <NetworkMap height={420} highlightRoute={emergency.route} showEmergency={true} />
          </div>
        </div>

        {/* RIGHT 30%: Ambulance Telemetry */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Ambulance Telemetry
            </h3>
            <span className="text-teal-700 font-mono font-bold text-xs">{emergency.vehicleId}</span>
          </div>

          <div className="space-y-3 text-xs font-medium">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90 min-w-0 w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium min-w-0 truncate">
                <MapPin size={14} className="text-rose-600 flex-shrink-0" /> <span className="truncate">Vehicle ID:</span>
              </span>
              <span className="text-slate-900 font-bold font-mono min-w-0 truncate text-right">{emergency.vehicleId}</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90 min-w-0 w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium min-w-0 truncate">
                <MapPin size={14} className="text-teal-600 flex-shrink-0" /> <span className="truncate">Current Junction:</span>
              </span>
              <span className="text-slate-900 font-bold min-w-0 truncate text-right">
                {emergency.route[emergency.currentSegment] || 'Junction 1'}
              </span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90 min-w-0 w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium min-w-0 truncate">
                <MapPin size={14} className="text-emerald-600 flex-shrink-0" /> <span className="truncate">Destination:</span>
              </span>
              <span className="text-slate-900 font-bold min-w-0 truncate text-right">{emergency.destination}</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90 min-w-0 w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium min-w-0 truncate">
                <Activity size={14} className="text-teal-600 flex-shrink-0" /> <span className="truncate">Speed:</span>
              </span>
              <span className="text-teal-700 font-bold font-mono tabular-nums min-w-0 truncate text-right">{emergency.speed} km/h</span>
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] gap-2 items-center p-3 rounded-xl bg-slate-50 border border-slate-200/90 min-w-0 w-full">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium min-w-0 truncate">
                <Clock size={14} className="text-rose-600 flex-shrink-0" /> <span className="truncate">ETA:</span>
              </span>
              <span className="text-rose-600 font-bold font-mono tabular-nums min-w-0 truncate text-right">1.8 min</span>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
