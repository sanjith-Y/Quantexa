export interface QUBOConfig {
  weights: {
    waitingTime: number;
    queueLength: number;
    emergencyPriority: number;
    spillbackRisk: number;
    co2: number;
    switchingCost: number;
  };
  numQubits: number;
  numIntersections: number;
  numTimeSlots: number;
  numPhases: number;
}

export interface IsingSolution {
  J: number[][];  // coupling matrix
  h: number[];    // local fields
  offset: number;
}

export interface QAOAResult {
  optimalBitstring: string;
  objectiveValue: number;
  iterations: number;
  energyHistory: number[];
  signalPlan: {
    intersectionId: string;
    phase: number;
    greenDuration: number;
  }[];
  converged: boolean;
}

export interface QuantumStatus {
  engine: 'ready' | 'running' | 'done' | 'error';
  backend: 'qiskit_aer' | 'local_demo';
  numQubits: number;
  depth: number;
  shots: number;
  lastRunTime: number; // ms
  totalRuns: number;
}

export interface OptimizationRun {
  id: string;
  timestamp: number;
  config: QUBOConfig;
  result: QAOAResult;
  duration: number;
}

export type OptimizationPhase = 
  | 'idle'
  | 'preparing_qubo'
  | 'converting_ising'
  | 'running_qaoa'
  | 'evaluating'
  | 'applying'
  | 'done';
