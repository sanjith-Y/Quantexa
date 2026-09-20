import React, { useState, useEffect } from 'react';
import { Clock, Monitor, User } from 'lucide-react';
import { useApp } from '../../hooks/useAppState';
import { formatTime } from '../../utils/helpers';

export function TopBar() {
  const { state, dispatch } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const simTime = formatTime(state.traffic.time);

  return (
    <header className="h-[72px] bg-white border-b border-slate-200/90 px-6 flex items-center justify-between flex-shrink-0 z-20 w-full min-w-0">
      {/* LEFT: Q Badge, App Title & Subtitle */}
      <div className="flex items-center gap-3.5 min-w-0 flex-shrink">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-lg shadow-2xs flex-shrink-0">
          Q
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug truncate">
            Quantum Traffic Optimization
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-none mt-0.5 truncate hidden sm:block">
            Smart Signals • Safer Roads • Greener Cities
          </p>
        </div>
      </div>

      {/* RIGHT: Status Badge, SIM Timer, Clock, Present, Admin Profile */}
      <div className="flex items-center justify-end gap-2 sm:gap-3 flex-shrink min-w-0 max-w-full">
        {/* System Online Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden 2xl:inline">System Online</span>
        </div>

        {/* SIM Timer */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/90 text-slate-700 text-xs font-mono tabular-nums font-bold flex-shrink-0">
          <Clock size={13} className="text-slate-500" />
          <span>SIM {simTime}</span>
        </div>

        {/* Real-time Digital Clock */}
        <div className="hidden 2xl:block text-xs font-mono tabular-nums text-slate-400 font-medium px-1">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block mx-0.5" />

        {/* Presentation Button */}
        <button
          onClick={() => dispatch({ type: 'TOGGLE_PRESENTATION' })}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300/90 text-xs font-bold transition shadow-2xs cursor-pointer flex-shrink-0"
          title="Toggle Fullscreen Presentation Mode"
        >
          <Monitor size={13} className="text-slate-600" />
          <span className="hidden sm:inline">Present</span>
        </button>

        {/* Traffic Admin Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 flex-shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-300/80 flex items-center justify-center text-slate-600 flex-shrink-0">
            <User size={15} />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Traffic Admin</div>
            <div className="text-[10px] text-slate-500 font-medium">City Operations</div>
          </div>
        </div>
      </div>
    </header>
  );
}
