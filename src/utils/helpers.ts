import type { Intersection, SpillbackAlert, Alert } from '../types/traffic';

export function getRiskColor(level: string): string {
  switch (level) {
    case 'critical': return '#ef4444';
    case 'high': return '#f59e0b';
    case 'medium': return '#eab308';
    default: return '#10b981';
  }
}

export function getDensityColor(density: number): string {
  if (density >= 80) return '#ef4444';
  if (density >= 60) return '#f59e0b';
  if (density >= 40) return '#eab308';
  return '#10b981';
}

export function getSignalColor(signal: string): string {
  switch (signal) {
    case 'green': return '#10b981';
    case 'yellow': return '#f59e0b';
    case 'red': return '#ef4444';
    case 'emergency': return '#06b6d4';
    default: return '#64748b';
  }
}

export function getAlertColor(type: Alert['type']): string {
  switch (type) {
    case 'critical': return '#ef4444';
    case 'warning': return '#f59e0b';
    case 'emergency': return '#06b6d4';
    case 'success': return '#10b981';
    default: return '#8b5cf6';
  }
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function formatNumber(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function formatSpeed(n: number, decimals = 0): string {
  return `${n.toFixed(decimals)} km/h`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getIntersectionPos(id: string): { x: number; y: number } {
  const positions: Record<string, { x: number; y: number }> = {
    J1: { x: 400, y: 80 },
    J2: { x: 200, y: 200 },
    J3: { x: 400, y: 200 },
    J4: { x: 600, y: 200 },
    J5: { x: 200, y: 320 },
    J6: { x: 400, y: 320 },
  };
  return positions[id] || { x: 0, y: 0 };
}

export const SCENARIOS = {
  normal: {
    name: 'Normal Traffic',
    densities: { J1: 30, J2: 40, J3: 45, J4: 35, J5: 38, J6: 32 },
    description: 'Typical urban traffic flow during off-peak hours.',
  },
  heavy: {
    name: 'Heavy Congestion',
    densities: { J1: 70, J2: 85, J3: 92, J4: 78, J5: 80, J6: 88 },
    description: 'Severe congestion across all intersections.',
  },
  accident: {
    name: 'Accident at J3',
    densities: { J1: 55, J2: 75, J3: 95, J4: 60, J5: 65, J6: 82 },
    blockedIntersections: ['J3'],
    description: 'Accident blocking J3, causing cascading congestion.',
  },
  roadClosure: {
    name: 'Road Closure',
    densities: { J1: 50, J2: 88, J3: 72, J4: 45, J5: 90, J6: 76 },
    blockedRoads: [{ from: 'J5', to: 'J6' }],
    description: 'Road closure between J5-J6, traffic rerouting.',
  },
  emergency: {
    name: 'Emergency Vehicle',
    densities: { J1: 45, J2: 55, J3: 68, J4: 50, J5: 42, J6: 48 },
    description: 'Emergency vehicle needs J1→J3→J4 corridor.',
  },
  peakHour: {
    name: 'Peak Hour',
    densities: { J1: 78, J2: 82, J3: 88, J4: 75, J5: 79, J6: 84 },
    description: 'Rush hour — maximum demand on all intersections.',
  },
};

export function getScenarioAlerts(scenario: string): string[] {
  switch (scenario) {
    case 'heavy': return [
      'Heavy congestion detected across network',
      'Queue spillback risk at J2→J3',
      'Reducing green cycles to prevent overflow',
    ];
    case 'accident': return [
      'ACCIDENT DETECTED at J3',
      'J3 blocked — rerouting traffic',
      'Spillback predicted at J2 in 18s',
      'Alternative route via J1→J2 activated',
    ];
    case 'roadClosure': return [
      'Road closure: J5→J6',
      'Traffic rerouting through J3→J6',
      'Increased load on J3 detected',
    ];
    case 'emergency': return [
      'EMERGENCY VEHICLE detected at J1',
      'Initiating predictive corridor preparation',
      'Estimating arrival times...',
    ];
    case 'peakHour': return [
      'Peak hour detected — activating adaptive control',
      'Quantum optimizer engaged',
      'Minimizing network-wide delay',
    ];
    default: return ['Normal traffic — monitoring active'];
  }
}
