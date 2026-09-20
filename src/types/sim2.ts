export interface Vehicle {
  id: number;
  lane: 'I1_NORTH' | 'I1_WEST' | 'I1_EAST' | 'LINK_DOWN' | 'LINK_UP' | 'I2_SOUTH' | 'I2_WEST' | 'I2_EAST';
  x: number;
  y: number;
  speed: number;
  maxSpeed: number;
  stopped: boolean;
  color: string;
  type: 'car' | 'truck' | 'bus';
  waitingTime: number; // accumulated waiting ticks
}

export type SignalState = 'RED' | 'YELLOW' | 'GREEN';

export interface IntersectionSignal {
  id: 'I1' | 'I2';
  name: string;
  currentPhase: 'NS' | 'EW';
  nsLight: SignalState;
  ewLight: SignalState;
  countdown: number;
  nsGreenDuration: number;
  ewGreenDuration: number;
  yellowDuration: number;
  redDuration: number;
}

export interface SimulationMetrics {
  avgWaitingTime: number; // in seconds
  totalQueueLength: number; // count of stopped vehicles
  vehiclesPassed: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  congestionPercentage: number; // 0 - 100%
  simulationTime: number; // in seconds
}

export interface OptimizationResult {
  quboVariables: number;
  candidateSolutions: number;
  bestObjectiveValue: number;
  i1NsGreen: number;
  i1EwGreen: number;
  i2NsGreen: number;
  i2EwGreen: number;
  timestamp: number;
  bitstring: string;
}

export interface ChartPoint {
  time: string;
  normalWait: number;
  quantumWait: number;
  normalQueue: number;
  quantumQueue: number;
  vehiclesPassed: number;
  congestion: number;
}
