// simulation/types.ts
// All core types for the new traffic simulation engine

export type VehicleType = 'car' | 'bus' | 'truck';
export type Direction = 'N' | 'S' | 'E' | 'W';
export type SignalState = 'GREEN' | 'YELLOW' | 'RED';
export type TurnIntent = 'straight' | 'left' | 'right';

export interface Vehicle {
  id: string;
  type: VehicleType;
  x: number;
  y: number;
  angle: number;       // radians, 0 = east
  speed: number;       // px/s
  maxSpeed: number;    // px/s
  length: number;      // px
  width: number;       // px
  color: string;
  lane: string;        // unique lane id e.g. "J1_W2E_0", "J2_N2S_0"
  progress: number;    // 0..1 along lane spline
  waitingTime: number; // seconds
  stopped: boolean;
  turnIntent: TurnIntent;
  targetLane: string | null;  // next lane after intersection
  passed: boolean;           // flagged for removal
}

export interface Signal {
  intersectionId: string;
  phase: string;   // e.g. 'NS' | 'EW' | 'N_EW' (for T-junction)
  state: SignalState;
  countdown: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
}

export interface Lane {
  id: string;
  points: [number, number][]; // polyline points
  direction: Direction;
  intersectionId: string | null;
  stopLineProgress: number;  // progress 0..1 where stopline is
  capacity: number;
  vehicles: string[];        // vehicle ids in order
  type: 'approach' | 'exit' | 'link';
}

export interface Intersection {
  id: string;
  label: string;
  type: '4-way' | '3-way';
  cx: number;
  cy: number;
  signals: Record<string, Signal>; // phase key -> signal
  currentPhase: string;
  phaseTimer: number;
  phases: string[];
  phaseIndex: number;
}

export interface SimMetrics {
  avgWaitingTime: number;
  queueLength: number;
  vehiclesPassed: number;
  congestion: number;    // 0-100
  j1Density: number;
  j2Density: number;
  simTime: number;
}

export interface OptimizationResult {
  j1GreenNS: number;
  j1GreenEW: number;
  j2GreenN: number;
  j2GreenEW: number;
  quboMatrix: number[][];
  bitsring: string;
  objectiveValue: number;
}

export interface SimState {
  vehicles: Map<string, Vehicle>;
  lanes: Map<string, Lane>;
  intersections: Map<string, Intersection>;
  metrics: SimMetrics;
  running: boolean;
  mode: 'normal' | 'quantum';
  density: 'low' | 'medium' | 'high';
  optimizing: boolean;
  optimizationPhase: number;
  lastOptResult: OptimizationResult | null;
  normalMetricsHistory: SimMetrics[];
  quantumMetricsHistory: SimMetrics[];
  spawnCooldowns: Map<string, number>;
  passedTotal: number;
}
