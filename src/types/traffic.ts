// Traffic network types
export interface Intersection {
  id: string;
  name: string;
  x: number;
  y: number;
  density: number; // 0-100
  queueLength: number; // vehicles
  capacity: number; // max vehicles
  signal: 'green' | 'yellow' | 'red' | 'emergency';
  signalCountdown: number; // seconds
  phase: number; // 0-3
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  waitingTime: number; // seconds avg
  throughput: number; // vehicles/min
  spillbackRisk: number; // 0-100
  emergencyStatus: 'none' | 'approaching' | 'at' | 'cleared';
  co2Rate: number; // g/min estimate
  predictedQueue: number;
  isBlocked: boolean;
}

export interface Road {
  from: string;
  to: string;
  capacity: number;
  currentFlow: number;
  isEmergencyRoute: boolean;
  isBlocked: boolean;
}

export interface Vehicle {
  id: string;
  type: 'car' | 'truck' | 'ambulance' | 'bus';
  position: { x: number; y: number };
  targetIntersection: string;
  currentRoad: string;
  speed: number;
  progress: number; // 0-1 along road
}

export interface TrafficState {
  intersections: Record<string, Intersection>;
  roads: Road[];
  vehicles: Vehicle[];
  time: number; // seconds
  mode: 'classical' | 'quantum';
  totalThroughput: number;
  avgWaitingTime: number;
  totalCO2: number;
  totalFuel: number;
}

export interface SignalPlan {
  intersectionId: string;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
  phase: number;
  source: 'classical' | 'quantum' | 'emergency' | 'recovery';
}

export interface EmergencyState {
  active: boolean;
  vehicleId: string;
  route: string[];
  currentSegment: number;
  position: { x: number; y: number };
  speed: number;
  destination: string;
  eta: Record<string, number>; // intersectionId -> seconds
  corridorPrepared: boolean[];
  phase: 'detecting' | 'predicting' | 'optimizing' | 'corridor' | 'active' | 'clearing' | 'recovery';
}

export interface SpillbackAlert {
  fromIntersection: string;
  toIntersection: string;
  currentQueue: number;
  predictedQueue: number;
  spillbackTime: number; // seconds until spillback
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: string;
  applied: boolean;
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical' | 'success' | 'emergency';
  message: string;
  timestamp: number;
  intersection?: string;
}

export interface MetricHistory {
  time: number;
  density: number;
  waitingTime: number;
  queueLength: number;
  throughput: number;
  co2: number;
  fuel: number;
}

export interface ComparisonMetrics {
  classical: {
    avgWaitingTime: number;
    maxQueue: number;
    emergencyTravelTime: number;
    throughput: number;
    fuel: number;
    co2: number;
    recoveryTime: number;
  };
  quantum: {
    avgWaitingTime: number;
    maxQueue: number;
    emergencyTravelTime: number;
    throughput: number;
    fuel: number;
    co2: number;
    recoveryTime: number;
  };
}
