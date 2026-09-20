import React from 'react';
import {
  LayoutDashboard,
  Play,
  Network,
  Cpu,
  BarChart3,
  Ambulance,
  Target,
  ChevronRight,
  LucideIcon
} from 'lucide-react';
import { useApp } from '../../hooks/useAppState';

interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { id: 'command', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'simulation', label: 'Simulation', icon: Play },
  { id: 'live', label: 'Traffic Network', icon: Network },
  { id: 'quantum', label: 'QUBO / QAOA', icon: Cpu },
  { id: 'analytics', label: 'Results & Analytics', icon: BarChart3 },
  { id: 'emergency', label: 'Emergency Corridor', icon: Ambulance },
];

export function Sidebar() {
  const { state, dispatch } = useApp();

  return (
    <aside className="w-[280px] min-w-[280px] max-w-[280px] bg-white border-r border-slate-200 h-screen flex flex-col flex-shrink-0 select-none z-30">
      {/* ── TOP BRAND HEADER (72px height matching TopBar) ── */}
      <div className="h-[72px] border-b border-slate-200 px-6 flex items-center gap-3.5 flex-shrink-0 bg-white">
        <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center font-bold text-white text-lg shadow-xs flex-shrink-0">
          ⚛
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold text-slate-900 tracking-tight leading-none uppercase truncate">
            Traffic Command
          </span>
          <span className="text-[11px] text-teal-700 font-semibold tracking-wider uppercase mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Autonomous AI
          </span>
        </div>
      </div>

      {/* ── NAVIGATION LIST ── */}
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 pt-1 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isSelected =
            (item.id === 'command' && state.currentPage === 'command') ||
            (item.id === 'simulation' &&
              (state.currentPage === 'simulation' ||
                state.currentPage === 'quantum-sim' ||
                state.currentPage === 'quantum-sim-new')) ||
            (item.id !== 'command' && item.id !== 'simulation' && state.currentPage === item.id);

          return (
            <button
              key={item.id}
              onClick={() => dispatch({ type: 'SET_PAGE', page: item.id })}
              className={`group w-full h-[46px] px-3.5 rounded-xl flex items-center gap-3 transition-all text-left cursor-pointer border ${
                isSelected
                  ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-bold shadow-xs border-r-4 border-r-teal-600'
                  : 'bg-transparent border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? 'text-teal-700 font-bold' : 'text-slate-400 group-hover:text-slate-700'
                }`}
              >
                <Icon size={18} />
              </div>

              <span className={`text-[13px] tracking-tight truncate flex-1 ${isSelected ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                {item.label}
              </span>

              {isSelected ? (
                <ChevronRight size={15} className="text-teal-600 flex-shrink-0 ml-auto" />
              ) : (
                <ChevronRight
                  size={15}
                  className="text-slate-300 opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0 ml-auto"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── BOTTOM PLATFORM OBJECTIVES CARD ── */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/60 mt-auto flex-shrink-0">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-2.5 uppercase tracking-wide">
            <div className="w-5 h-5 rounded bg-teal-50 text-teal-600 flex items-center justify-center">
              <Target size={12} />
            </div>
            <span>Platform Objectives</span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-600 font-medium">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
              <span>Congestion Cut: -42%</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
              <span>CO₂ Emissions: -25%</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
              <span>Emergency Response: Instant</span>
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
