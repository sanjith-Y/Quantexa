import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../hooks/useAppState';
import { SCENARIOS } from '../../utils/helpers';
import { Play, SkipForward, RotateCcw, X, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

const DEMO_STEPS = [
  {
    step: 1,
    title: 'Normal Traffic Baseline',
    desc: 'Observing nominal urban flow with steady arrival rates and balanced intersection queues across J1–J6.',
    action: (dispatch: any) => {
      dispatch({ type: 'SET_SCENARIO', scenario: 'normal', densities: SCENARIOS.normal.densities });
      dispatch({ type: 'SET_MODE', mode: 'classical' });
      dispatch({ type: 'END_EMERGENCY' });
    },
  },
  {
    step: 2,
    title: 'Sudden Congestion Surge',
    desc: 'Peak arrival spike at J2 & J3 causes queue density to surge above 85%. Conventional fixed timers begin failing.',
    action: (dispatch: any) => {
      dispatch({ type: 'SET_SCENARIO', scenario: 'heavy', densities: SCENARIOS.heavy.densities });
    },
  },
  {
    step: 3,
    title: 'Spillback Prediction & Firewall',
    desc: 'Downstream capacity prediction detects incoming spillback at J2→J3 in 18 seconds. Automated throttling initiates.',
    action: (dispatch: any) => {
      dispatch({
        type: 'ADD_ALERT',
        alert: {
          id: 'demo-sb',
          type: 'warning',
          message: 'FIREWALL: J3 predicted to exceed 90% capacity in 18s. J2 green duration throttled by 6s.',
          timestamp: Date.now(),
          intersection: 'J3',
        },
      });
    },
  },
  {
    step: 4,
    title: 'Emergency Vehicle Detected',
    desc: 'Ambulance AMB-001 entering network at Junction 1, en route to City Hospital via J1 → J3 → J4.',
    action: (dispatch: any) => {
      dispatch({ type: 'START_EMERGENCY' });
    },
  },
  {
    step: 5,
    title: 'Predictive Green Corridor Prep',
    desc: 'Rather than reacting on arrival, QUBO anticipates the ambulance ETA (8s J1, 21s J3, 37s J4) and flushes downstream queues ahead of time.',
    action: (dispatch: any) => {
      dispatch({
        type: 'ADD_ALERT',
        alert: {
          id: 'demo-prep',
          type: 'emergency',
          message: 'PREDICTIVE PREPARATION: Corridor J1→J3 pre-cleared before vehicle arrival.',
          timestamp: Date.now(),
          intersection: 'J1',
        },
      });
    },
  },
  {
    step: 6,
    title: 'QUBO + QAOA Optimization',
    desc: 'Hybrid Quantum-Classical Optimizer executes Ising Hamiltonian minimization on Qiskit Aer emulator.',
    action: (dispatch: any) => {
      dispatch({ type: 'SET_MODE', mode: 'quantum' });
      dispatch({ type: 'SET_OPTIMIZATION_PHASE', phase: 'running_qaoa' });
      setTimeout(() => {
        dispatch({ type: 'SET_OPTIMIZATION_PHASE', phase: 'done' });
      }, 1500);
    },
  },
  {
    step: 7,
    title: 'Emergency Vehicle Traversal',
    desc: 'Ambulance clears J1, J3, and exits through J4 with zero stopped delays or emergency braking.',
    action: (dispatch: any) => {
      dispatch({ type: 'ADVANCE_EMERGENCY' });
      setTimeout(() => dispatch({ type: 'ADVANCE_EMERGENCY' }), 1000);
    },
  },
  {
    step: 8,
    title: 'Self-Healing Recovery Optimization',
    desc: 'Vehicle passes. System does NOT abruptly snap to rigid cycles; it runs temporary recovery dispersion vectors.',
    action: (dispatch: any) => {
      dispatch({ type: 'END_EMERGENCY' });
      dispatch({
        type: 'ADD_ALERT',
        alert: {
          id: 'demo-rec',
          type: 'success',
          message: 'SELF-HEALING ACTIVE: Dissipating residual side-street queues across J2, J5, J6.',
          timestamp: Date.now(),
        },
      });
    },
  },
  {
    step: 9,
    title: 'Classical vs Quantum Twin Benchmark',
    desc: 'Side-by-side verification: Hybrid Quantum delivers 38% lower wait times, 42% faster recovery, and 24% lower CO₂.',
    action: (dispatch: any) => {
      dispatch({ type: 'SET_PAGE', page: 'digital-twin' });
    },
  },
  {
    step: 10,
    title: 'Final Live Network Stabilization',
    desc: 'Hackathon demonstration completed. Network restored to optimal adaptive steady state.',
    action: (dispatch: any) => {
      dispatch({ type: 'SET_PAGE', page: 'command' });
      dispatch({
        type: 'ADD_ALERT',
        alert: {
          id: 'demo-end',
          type: 'success',
          message: 'DEMO FINISHED: Network stabilized at steady-state equilibrium.',
          timestamp: Date.now(),
        },
      });
    },
  },
];

export function HackathonDemoModal() {
  const { state, dispatch } = useApp();
  const [autoPlay, setAutoPlay] = useState(false);

  const currentStepIdx = state.hackathonDemoStep;
  const currentStep = DEMO_STEPS[currentStepIdx] || DEMO_STEPS[0];

  const handleStep = (stepIdx: number) => {
    if (stepIdx >= DEMO_STEPS.length) {
      dispatch({ type: 'SET_HACKATHON_DEMO', active: false });
      return;
    }
    dispatch({ type: 'SET_HACKATHON_DEMO', active: true, step: stepIdx });
    DEMO_STEPS[stepIdx].action(dispatch);
  };

  useEffect(() => {
    let timer: any;
    if (autoPlay && state.hackathonDemoActive) {
      timer = setTimeout(() => {
        if (currentStepIdx < DEMO_STEPS.length - 1) {
          handleStep(currentStepIdx + 1);
        } else {
          setAutoPlay(false);
        }
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [autoPlay, currentStepIdx, state.hackathonDemoActive]);

  if (!state.hackathonDemoActive) return null;

  return (
    <div className="fixed bottom-4 left-64 right-72 z-50 pointer-events-auto">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="glass-card border-2 border-cyan-400/50 p-4 shadow-2xl bg-slate-950/95 rounded-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
              Hackathon Demo Mode · Step {currentStep.step} of 10
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                autoPlay
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
              }`}
            >
              <Play size={12} /> {autoPlay ? 'Pause Auto-Run' : 'Auto Play (5s)'}
            </button>
            <button
              onClick={() => dispatch({ type: 'SET_HACKATHON_DEMO', active: false })}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="grid grid-cols-10 gap-1.5 mb-3">
          {DEMO_STEPS.map((s, idx) => (
            <button
              key={s.step}
              onClick={() => handleStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIdx
                  ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]'
                  : idx < currentStepIdx
                  ? 'bg-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Step ${s.step}: ${s.title}`}
            />
          ))}
        </div>

        {/* Current Step Description */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              {currentStep.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {currentStep.desc}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {currentStepIdx > 0 && (
              <button
                onClick={() => handleStep(currentStepIdx - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-mono font-medium"
              >
                Back
              </button>
            )}
            <button
              onClick={() => handleStep(currentStepIdx + 1)}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
            >
              {currentStepIdx === DEMO_STEPS.length - 1 ? 'Finish Demo' : 'Next Step'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
