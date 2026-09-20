import type { TrafficState, Intersection, Road, Vehicle, SignalPlan, MetricHistory, SpillbackAlert } from '../types/traffic';

// Seeded random for reproducibility
let seed = 42;
function seededRandom(): number {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}
export function resetSeed(s: number = 42) { seed = s; }

// Network topology
export const NETWORK_TOPOLOGY = {
  intersections: [
    { id: 'J1', name: 'Junction 1', x: 400, y: 80, capacity: 30 },
    { id: 'J2', name: 'Junction 2', x: 200, y: 200 },
    { id: 'J3', name: 'Junction 3', x: 400, y: 200, capacity: 35 },
    { id: 'J4', name: 'Junction 4', x: 600, y: 200, capacity: 25 },
    { id: 'J5', name: 'Junction 5', x: 200, y: 320, capacity: 28 },
    { id: 'J6', name: 'Junction 6', x: 400, y: 320, capacity: 30 },
  ],
  roads: [
    { from: 'J1', to: 'J3' },
    { from: 'J2', to: 'J3' },
    { from: 'J3', to: 'J4' },
    { from: 'J3', to: 'J6' },
    { from: 'J5', to: 'J6' },
    { from: 'J1', to: 'J2' },
  ]
};

function createIntersection(id: string, x: number, y: number, density = 30): Intersection {
  const capacity = 30;
  const queue = Math.floor(density * 0.3);
  return {
    id, name: `Junction ${id.slice(1)}`, x, y,
    density,
    queueLength: queue,
    capacity,
    signal: 'green',
    signalCountdown: 25,
    phase: 0,
    riskLevel: density > 70 ? 'high' : density > 50 ? 'medium' : 'low',
    waitingTime: density * 0.4,
    throughput: Math.max(0, 20 - queue * 0.5),
    spillbackRisk: density > 80 ? density - 60 : 0,
    emergencyStatus: 'none',
    co2Rate: density * 0.8,
    predictedQueue: queue + 2,
    isBlocked: false,
  };
}

export function createInitialState(densities?: Record<string, number>): TrafficState {
  const d = densities || { J1: 35, J2: 48, J3: 72, J4: 41, J5: 28, J6: 55 };
  
  const intersections: Record<string, Intersection> = {
    J1: createIntersection('J1', 400, 80, d.J1),
    J2: createIntersection('J2', 200, 200, d.J2),
    J3: createIntersection('J3', 400, 200, d.J3),
    J4: createIntersection('J4', 600, 200, d.J4),
    J5: createIntersection('J5', 200, 320, d.J5),
    J6: createIntersection('J6', 400, 320, d.J6),
  };

  const roads: Road[] = [
    { from: 'J1', to: 'J3', capacity: 20, currentFlow: 8, isEmergencyRoute: false, isBlocked: false },
    { from: 'J2', to: 'J3', capacity: 15, currentFlow: 6, isEmergencyRoute: false, isBlocked: false },
    { from: 'J3', to: 'J4', capacity: 18, currentFlow: 9, isEmergencyRoute: false, isBlocked: false },
    { from: 'J3', to: 'J6', capacity: 15, currentFlow: 5, isEmergencyRoute: false, isBlocked: false },
    { from: 'J5', to: 'J6', capacity: 12, currentFlow: 4, isEmergencyRoute: false, isBlocked: false },
    { from: 'J1', to: 'J2', capacity: 15, currentFlow: 6, isEmergencyRoute: false, isBlocked: false },
  ];

  return {
    intersections,
    roads,
    vehicles: [],
    time: 0,
    mode: 'classical',
    totalThroughput: 18,
    avgWaitingTime: 32,
    totalCO2: 0,
    totalFuel: 0,
  };
}

// Classical signal timing (fixed cycle)
export function classicalSignalUpdate(state: TrafficState, dt: number): Partial<Record<string, Intersection>> {
  const updates: Partial<Record<string, Intersection>> = {};
  
  Object.values(state.intersections).forEach(inter => {
    if (inter.isBlocked) return;
    
    let countdown = inter.signalCountdown - dt;
    let signal = inter.signal;
    let phase = inter.phase;
    
    if (countdown <= 0) {
      // Fixed cycle: green 30s -> yellow 5s -> red 25s
      if (signal === 'green') { signal = 'yellow'; countdown = 5; }
      else if (signal === 'yellow') { signal = 'red'; countdown = 25; }
      else { signal = 'green'; countdown = 30; phase = (phase + 1) % 4; }
    }
    
    updates[inter.id] = { ...inter, signal, signalCountdown: countdown, phase };
  });
  
  return updates;
}

// Quantum-optimized signal timing (adaptive based on density)
export function quantumSignalUpdate(state: TrafficState, dt: number): Partial<Record<string, Intersection>> {
  const updates: Partial<Record<string, Intersection>> = {};
  
  Object.values(state.intersections).forEach(inter => {
    if (inter.isBlocked) return;
    
    let countdown = inter.signalCountdown - dt;
    let signal = inter.signal;
    let phase = inter.phase;
    
    // Adaptive green time based on queue
    const adaptiveGreen = Math.min(45, Math.max(15, 20 + inter.queueLength * 0.8));
    
    if (countdown <= 0) {
      if (signal === 'green') { signal = 'yellow'; countdown = 4; } // Shorter yellow = quantum opt
      else if (signal === 'yellow') { signal = 'red'; countdown = Math.max(15, 30 - inter.queueLength * 0.5); }
      else { signal = 'green'; countdown = adaptiveGreen; phase = (phase + 1) % 4; }
    }
    
    updates[inter.id] = { ...inter, signal, signalCountdown: countdown, phase };
  });
  
  return updates;
}

// Vehicle flow simulation
export function updateTrafficFlow(state: TrafficState, dt: number, mode: 'classical' | 'quantum'): Partial<Record<string, Intersection>> {
  const updates: Partial<Record<string, Intersection>> = {};
  const rand = seededRandom;

  Object.values(state.intersections).forEach(inter => {
    if (inter.isBlocked) {
      updates[inter.id] = { ...inter, density: Math.min(100, inter.density + 5 * dt), queueLength: Math.min(inter.capacity, inter.queueLength + 2 * dt) };
      return;
    }

    // Arrivals (Poisson-like)
    const arrivalRate = inter.density * 0.015 + 0.05;
    const arrivals = rand() < arrivalRate * dt ? 1 : 0;
    
    // Departures depend on signal
    let departureRate = 0;
    if (inter.signal === 'green') {
      departureRate = mode === 'quantum' ? 0.85 : 0.7;
    } else if (inter.signal === 'emergency') {
      departureRate = 0;
    }
    
    const departures = inter.queueLength > 0 && rand() < departureRate * dt ? Math.min(inter.queueLength, 2) : 0;
    
    const newQueue = Math.max(0, Math.min(inter.capacity, inter.queueLength + arrivals - departures));
    const newDensity = Math.max(5, Math.min(100, (newQueue / inter.capacity) * 100));
    const newWaiting = newDensity * (mode === 'quantum' ? 0.32 : 0.42) + rand() * 5;
    const throughput = departures * (60 / Math.max(1, dt));
    const riskLevel = newDensity > 85 ? 'critical' : newDensity > 70 ? 'high' : newDensity > 50 ? 'medium' : 'low';
    const spillback = Math.max(0, newDensity - 75);
    
    updates[inter.id] = {
      ...inter,
      density: newDensity,
      queueLength: newQueue,
      waitingTime: newWaiting,
      throughput: Math.max(0, throughput),
      riskLevel,
      spillbackRisk: spillback,
      co2Rate: newDensity * 0.8,
      predictedQueue: newQueue + Math.floor(arrivalRate * 10),
    };
  });

  return updates;
}

// Spillback detection
export function detectSpillback(state: TrafficState): SpillbackAlert[] {
  const alerts: SpillbackAlert[] = [];
  
  state.roads.forEach(road => {
    const from = state.intersections[road.from];
    const to = state.intersections[road.to];
    if (!from || !to) return;
    
    if (to.density > 75) {
      const spillbackTime = Math.max(5, (100 - to.density) * 2);
      alerts.push({
        fromIntersection: road.from,
        toIntersection: road.to,
        currentQueue: to.queueLength,
        predictedQueue: to.predictedQueue,
        spillbackTime,
        riskLevel: to.density > 90 ? 'critical' : to.density > 80 ? 'high' : 'medium',
        recommendedAction: `Reduce ${road.from} green by ${Math.floor((to.density - 70) * 0.2)}s`,
        applied: false,
      });
    }
  });
  
  return alerts;
}

// Emergency corridor preparation
export function prepareEmergencyCorridor(
  state: TrafficState,
  route: string[],
  segment: number
): Partial<Record<string, Intersection>> {
  const updates: Partial<Record<string, Intersection>> = {};
  
  route.forEach((intId, idx) => {
    const inter = state.intersections[intId];
    if (!inter) return;
    
    if (idx <= segment + 1) {
      // Current and next intersection get emergency treatment
      updates[intId] = {
        ...inter,
        signal: idx === segment ? 'emergency' : 'green',
        emergencyStatus: idx === segment ? 'at' : idx < segment ? 'cleared' : 'approaching',
        signalCountdown: idx === segment ? 99 : 30,
      };
    }
  });
  
  return updates;
}

// Metrics calculation
export function calculateMetrics(state: TrafficState): {
  avgWaitingTime: number;
  totalThroughput: number;
  totalCO2: number;
  totalFuel: number;
  maxQueue: number;
} {
  const intersections = Object.values(state.intersections);
  const avgWaiting = intersections.reduce((s, i) => s + i.waitingTime, 0) / intersections.length;
  const throughput = intersections.reduce((s, i) => s + i.throughput, 0);
  const co2 = intersections.reduce((s, i) => s + i.co2Rate, 0);
  const maxQueue = Math.max(...intersections.map(i => i.queueLength));
  
  return {
    avgWaitingTime: avgWaiting,
    totalThroughput: throughput,
    totalCO2: co2 * 0.1,
    totalFuel: co2 * 0.04,
    maxQueue,
  };
}

// QUBO simulation
export function simulateQUBO(config: {
  weights: Record<string, number>;
  intersections: Intersection[];
}): {
  matrix: number[][];
  objectiveValue: number;
  bitstring: string;
  signalPlan: Array<{ id: string; green: number; phase: number }>;
} {
  const n = config.intersections.length;
  const matrix: number[][] = Array.from({ length: n * 2 }, () => Array(n * 2).fill(0));
  
  // Build QUBO matrix based on density and weights
  config.intersections.forEach((inter, i) => {
    const densityWeight = inter.density / 100;
    matrix[i * 2][i * 2] = -densityWeight * config.weights.waitingTime;
    matrix[i * 2 + 1][i * 2 + 1] = -densityWeight * config.weights.queueLength;
    
    // Coupling between adjacent intersections (penalize conflicting phases)
    if (i < n - 1) {
      matrix[i * 2][i * 2 + 2] = 0.3 * config.weights.spillbackRisk;
      matrix[i * 2 + 2][i * 2] = 0.3 * config.weights.spillbackRisk;
    }
  });

  // Simulate QAOA finding optimal bitstring
  let bestObj = Infinity;
  let bestBits = '0'.repeat(n * 2);
  
  for (let trial = 0; trial < 50; trial++) {
    const bits = Array.from({ length: n * 2 }, () => seededRandom() > 0.5 ? 1 : 0);
    let obj = 0;
    for (let i = 0; i < n * 2; i++) {
      for (let j = 0; j < n * 2; j++) {
        obj += matrix[i][j] * bits[i] * bits[j];
      }
    }
    if (obj < bestObj) {
      bestObj = obj;
      bestBits = bits.join('');
    }
  }

  const signalPlan = config.intersections.map((inter, i) => ({
    id: inter.id,
    green: Math.min(45, Math.max(15, 20 + (parseInt(bestBits[i]) ? inter.queueLength : 0))),
    phase: parseInt(bestBits[i * 2] || '0'),
  }));

  return { matrix, objectiveValue: bestObj, bitstring: bestBits, signalPlan };
}
