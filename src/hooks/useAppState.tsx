import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { TrafficState, Intersection, EmergencyState, Alert, SpillbackAlert, MetricHistory } from '../types/traffic';
import type { QuantumStatus, OptimizationPhase } from '../types/quantum';
import {
  createInitialState,
  classicalSignalUpdate,
  quantumSignalUpdate,
  updateTrafficFlow,
  detectSpillback,
  prepareEmergencyCorridor,
  calculateMetrics,
} from '../utils/simulation';
import { generateId } from '../utils/helpers';

interface AppState {
  traffic: TrafficState;
  emergency: EmergencyState;
  alerts: Alert[];
  spillbackAlerts: SpillbackAlert[];
  metricHistory: MetricHistory[];
  quantumStatus: QuantumStatus;
  optimizationPhase: OptimizationPhase;
  activeMode: 'classical' | 'quantum';
  isPaused: boolean;
  simSpeed: 1 | 2 | 4;
  presentationMode: boolean;
  selectedIntersection: string | null;
  currentPage: string;
  hackathonDemoStep: number;
  hackathonDemoActive: boolean;
}

type Action =
  | { type: 'TICK'; dt: number }
  | { type: 'SET_MODE'; mode: 'classical' | 'quantum' }
  | { type: 'SET_PAUSED'; paused: boolean }
  | { type: 'SET_SPEED'; speed: 1 | 2 | 4 }
  | { type: 'RESET_SIMULATION' }
  | { type: 'START_EMERGENCY' }
  | { type: 'END_EMERGENCY' }
  | { type: 'ADVANCE_EMERGENCY' }
  | { type: 'ADD_ALERT'; alert: Alert }
  | { type: 'CLEAR_ALERTS' }
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SELECT_INTERSECTION'; id: string | null }
  | { type: 'SET_SCENARIO'; scenario: string; densities: Record<string, number> }
  | { type: 'SET_OPTIMIZATION_PHASE'; phase: OptimizationPhase }
  | { type: 'TOGGLE_PRESENTATION' }
  | { type: 'SET_HACKATHON_DEMO'; active: boolean; step?: number }
  | { type: 'NEXT_DEMO_STEP' };

const initialEmergency: EmergencyState = {
  active: false,
  vehicleId: 'AMB-001',
  route: ['J1', 'J3', 'J4'],
  currentSegment: 0,
  position: { x: 400, y: 80 },
  speed: 60,
  destination: 'City Hospital',
  eta: { J1: 0, J3: 18, J4: 36 },
  corridorPrepared: [false, false, false],
  phase: 'detecting',
};

const initialQuantumStatus: QuantumStatus = {
  engine: 'ready',
  backend: 'local_demo',
  numQubits: 12,
  depth: 4,
  shots: 1024,
  lastRunTime: 0,
  totalRuns: 0,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TICK': {
      const { dt } = action;
      const traffic = state.traffic;
      
      // Signal updates
      const signalUpdates = state.activeMode === 'quantum'
        ? quantumSignalUpdate(traffic, dt)
        : classicalSignalUpdate(traffic, dt);
      
      // Flow updates
      const updatedIntersections: Record<string, Intersection> = {
        ...traffic.intersections,
        ...(signalUpdates as Record<string, Intersection>),
      };

      const flowUpdates = updateTrafficFlow(
        { ...traffic, intersections: updatedIntersections },
        dt,
        state.activeMode
      );

      const newIntersections: Record<string, Intersection> = {
        ...traffic.intersections,
        ...(signalUpdates as Record<string, Intersection>),
        ...(flowUpdates as Record<string, Intersection>),
      };

      // Emergency progression
      let newEmergency = state.emergency;
      if (state.emergency.active) {
        const corridorUpdates = prepareEmergencyCorridor(
          { ...traffic, intersections: newIntersections },
          state.emergency.route,
          state.emergency.currentSegment
        );
        Object.assign(newIntersections, corridorUpdates);
      }

      const newTraffic: TrafficState = {
        ...traffic,
        intersections: newIntersections,
        time: traffic.time + dt,
      };
      const metrics = calculateMetrics(newTraffic);
      const spillbacks = detectSpillback(newTraffic);

      // History
      const histEntry: MetricHistory = {
        time: newTraffic.time,
        density: Object.values(newIntersections).reduce((s: number, i: Intersection) => s + i.density, 0) / 6,
        waitingTime: metrics.avgWaitingTime,
        queueLength: metrics.maxQueue,
        throughput: metrics.totalThroughput,
        co2: metrics.totalCO2,
        fuel: metrics.totalFuel,
      };

      const newHistory = [...state.metricHistory.slice(-300), histEntry];

      // Auto-alerts
      const newAlerts = [...state.alerts];
      if (spillbacks.length > 0 && Math.random() < 0.02) {
        const sb = spillbacks[0];
        newAlerts.push({
          id: generateId(),
          type: 'warning',
          message: `Spillback predicted: ${sb.toIntersection} at ${sb.spillbackTime.toFixed(0)}s`,
          timestamp: Date.now(),
          intersection: sb.toIntersection,
        });
      }

      return {
        ...state,
        traffic: { ...newTraffic, ...metrics },
        spillbackAlerts: spillbacks,
        metricHistory: newHistory,
        alerts: newAlerts.slice(-20),
      };
    }

    case 'SET_MODE':
      return { ...state, activeMode: action.mode, traffic: { ...state.traffic, mode: action.mode } };

    case 'SET_PAUSED':
      return { ...state, isPaused: action.paused };

    case 'SET_SPEED':
      return { ...state, simSpeed: action.speed };

    case 'RESET_SIMULATION':
      return {
        ...state,
        traffic: createInitialState(),
        emergency: initialEmergency,
        spillbackAlerts: [],
        metricHistory: [],
        alerts: [{
          id: generateId(),
          type: 'info',
          message: 'Simulation reset to baseline state.',
          timestamp: Date.now(),
        }],
      };

    case 'START_EMERGENCY': {
      const alertMsg: Alert = {
        id: generateId(),
        type: 'emergency',
        message: 'EMERGENCY VEHICLE detected at J1 — initiating predictive corridor',
        timestamp: Date.now(),
        intersection: 'J1',
      };
      return {
        ...state,
        emergency: { ...initialEmergency, active: true, phase: 'detecting' },
        alerts: [alertMsg, ...state.alerts].slice(0, 20),
      };
    }

    case 'END_EMERGENCY': {
      // Reset intersections from emergency mode
      const recovered = { ...state.traffic.intersections };
      state.emergency.route.forEach(id => {
        if (recovered[id]) {
          recovered[id] = {
            ...recovered[id],
            signal: 'green',
            emergencyStatus: 'none',
            signalCountdown: 25,
          };
        }
      });
      const alert: Alert = {
        id: generateId(),
        type: 'success',
        message: 'Emergency vehicle cleared — initiating self-healing recovery',
        timestamp: Date.now(),
      };
      return {
        ...state,
        emergency: { ...initialEmergency, active: false },
        traffic: { ...state.traffic, intersections: recovered },
        alerts: [alert, ...state.alerts].slice(0, 20),
      };
    }

    case 'ADVANCE_EMERGENCY': {
      const em = state.emergency;
      const nextSegment = Math.min(em.currentSegment + 1, em.route.length - 1);
      const nextPhase = nextSegment >= em.route.length - 1 ? 'clearing' : 'active';
      
      const route = em.route;
      const nextId = route[nextSegment];
      const inter = state.traffic.intersections[nextId];
      
      const newPos = inter ? { x: inter.x, y: inter.y } : em.position;
      const newPrepared = [...em.corridorPrepared];
      if (nextSegment < newPrepared.length) newPrepared[nextSegment] = true;

      const alert: Alert = {
        id: generateId(),
        type: 'emergency',
        message: `Emergency vehicle at ${nextId} — corridor segment ${nextSegment + 1}/${route.length}`,
        timestamp: Date.now(),
        intersection: nextId,
      };

      return {
        ...state,
        emergency: {
          ...em,
          currentSegment: nextSegment,
          position: newPos,
          phase: nextPhase,
          corridorPrepared: newPrepared,
        },
        alerts: [alert, ...state.alerts].slice(0, 20),
      };
    }

    case 'ADD_ALERT':
      return { ...state, alerts: [action.alert, ...state.alerts].slice(0, 20) };

    case 'CLEAR_ALERTS':
      return { ...state, alerts: [] };

    case 'SET_PAGE':
      return { ...state, currentPage: action.page };

    case 'SELECT_INTERSECTION':
      return { ...state, selectedIntersection: action.id };

    case 'SET_SCENARIO': {
      const newTraffic = createInitialState(action.densities);
      return {
        ...state,
        traffic: { ...newTraffic, mode: state.activeMode },
        alerts: [{
          id: generateId(),
          type: 'info',
          message: `Scenario loaded: ${action.scenario}`,
          timestamp: Date.now(),
        }],
      };
    }

    case 'SET_OPTIMIZATION_PHASE':
      return { ...state, optimizationPhase: action.phase };

    case 'TOGGLE_PRESENTATION':
      return { ...state, presentationMode: !state.presentationMode };

    case 'SET_HACKATHON_DEMO':
      return { ...state, hackathonDemoActive: action.active, hackathonDemoStep: action.step ?? 0 };

    case 'NEXT_DEMO_STEP':
      return { ...state, hackathonDemoStep: state.hackathonDemoStep + 1 };

    default:
      return state;
  }
}

const initialState: AppState = {
  traffic: createInitialState(),
  emergency: initialEmergency,
  alerts: [
    { id: '1', type: 'info', message: 'QUANTUM-SHIELD system online', timestamp: Date.now() - 5000 },
    { id: '2', type: 'success', message: 'Quantum engine ready — Qiskit Aer loaded', timestamp: Date.now() - 3000 },
    { id: '3', type: 'info', message: 'Traffic simulation started — 6 intersections active', timestamp: Date.now() - 1000 },
  ],
  spillbackAlerts: [],
  metricHistory: [],
  quantumStatus: initialQuantumStatus,
  optimizationPhase: 'idle',
  activeMode: 'classical',
  isPaused: false,
  simSpeed: 1,
  presentationMode: false,
  selectedIntersection: null,
  currentPage: 'command',
  hackathonDemoStep: 0,
  hackathonDemoActive: false,
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state.isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const intervalMs = Math.max(125, 500 / state.simSpeed);
    intervalRef.current = setInterval(() => {
      dispatch({ type: 'TICK', dt: 0.5 * state.simSpeed });
    }, intervalMs);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [state.isPaused, state.simSpeed]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
