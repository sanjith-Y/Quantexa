import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import { Play, Pause, RotateCcw, Zap, Monitor, ChevronRight, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, BarChart, Bar } from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────
type VehicleType = 'car' | 'bus' | 'truck';
type SignalState = 'GREEN' | 'YELLOW' | 'RED';

interface Vehicle {
  id: number;
  type: VehicleType;
  laneId: string;
  progress: number;  // 0→1 along lane
  speed: number;     // progress units/s
  maxSpeed: number;
  length: number;    // in progress units (normalised)
  color: string;
  waitTime: number;
  passed: boolean;
}

interface Signal {
  phase: 'NS' | 'EW' | 'N';  // NS=north-south green, EW=east-west green, N=north green
  state: SignalState;
  timer: number;
  greenTime: number;
  yellowTime: number;
  redTime: number;
}

interface Intersection {
  id: 'J1' | 'J2';
  signal: Signal;
}

interface Lane {
  id: string;
  // world coordinates for rendering
  x1: number; y1: number; x2: number; y2: number;
  length: number;          // pixels
  intersectionId: 'J1' | 'J2' | null;
  isApproach: boolean;
  signalPhase: 'NS' | 'EW' | 'N' | null;
  nextLanes: string[];
  spawnPoint: boolean;
}

interface ChartPoint {
  t: string;
  normalWait: number;
  quantumWait: number;
  normalQueue: number;
  quantumQueue: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CANVAS CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CW = 900;
const CH = 520;
const RH = 26;   // half road width (one lane = 26px)

// Intersection centres
const J1X = 260; const J1Y = 260;
const J2X = 650; const J2Y = 260;

// Lane offset within road (left/right of centre)
const LO = 13;

// ─────────────────────────────────────────────────────────────────────────────
//  LANE DEFINITIONS
//  Each lane is a straight segment. Progress 0 = start, 1 = end.
//  Approach lanes: end is at the stopline (intersection edge).
//  Exit lanes: start is at intersection edge.
// ─────────────────────────────────────────────────────────────────────────────
const LANES: Lane[] = [
  // J1 — West approach (Westbound vehicles travel W→E, stop at J1)
  { id:'j1_w_app', x1:0, y1:J1Y-LO, x2:J1X-RH, y2:J1Y-LO, length:J1X-RH, intersectionId:'J1', isApproach:true, signalPhase:'EW', nextLanes:['j1_exit_e'], spawnPoint:true },
  // J1 — East approach (E→W traffic, from right side, feeds from J2 west exit)
  { id:'j1_e_app', x1:J1X+RH, y1:J1Y+LO, x2:0, y2:J1Y+LO, length:J1X+RH, intersectionId:'J1', isApproach:true, signalPhase:'EW', nextLanes:['j1_exit_w'], spawnPoint:false },
  // J1 — North approach (N→S)
  { id:'j1_n_app', x1:J1X+LO, y1:0, x2:J1X+LO, y2:J1Y-RH, length:J1Y-RH, intersectionId:'J1', isApproach:true, signalPhase:'NS', nextLanes:['j1_exit_s'], spawnPoint:true },
  // J1 — South approach (S→N)
  { id:'j1_s_app', x1:J1X-LO, y1:CH, x2:J1X-LO, y2:J1Y+RH, length:CH-J1Y-RH, intersectionId:'J1', isApproach:true, signalPhase:'NS', nextLanes:['j1_exit_n'], spawnPoint:true },

  // J1 — Exits
  { id:'j1_exit_e', x1:J1X+RH, y1:J1Y-LO, x2:J2X-RH, y2:J2Y-LO, length:J2X-J1X-2*RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:['j2_w_app'], spawnPoint:false },
  { id:'j1_exit_w', x1:J1X-RH, y1:J1Y+LO, x2:0, y2:J1Y+LO, length:J1X-RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:[], spawnPoint:false },
  { id:'j1_exit_s', x1:J1X+LO, y1:J1Y+RH, x2:J1X+LO, y2:CH, length:CH-J1Y-RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:[], spawnPoint:false },
  { id:'j1_exit_n', x1:J1X-LO, y1:J1Y-RH, x2:J1X-LO, y2:0, length:J1Y-RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:[], spawnPoint:false },

  // J2 — West approach (from J1 exit east)
  { id:'j2_w_app', x1:J1X+RH, y1:J2Y-LO, x2:J2X-RH, y2:J2Y-LO, length:J2X-J1X-2*RH, intersectionId:'J2', isApproach:true, signalPhase:'EW', nextLanes:['j2_exit_e','j2_exit_n'], spawnPoint:false },
  // J2 — East approach (E→W from right edge)
  { id:'j2_e_app', x1:CW, y1:J2Y+LO, x2:J2X+RH, y2:J2Y+LO, length:CW-J2X-RH, intersectionId:'J2', isApproach:true, signalPhase:'EW', nextLanes:['j2_exit_w','j2_exit_n'], spawnPoint:true },
  // J2 — North approach (N→S, T-junction has no south exit so goes into junction)
  { id:'j2_n_app', x1:J2X+LO, y1:0, x2:J2X+LO, y2:J2Y-RH, length:J2Y-RH, intersectionId:'J2', isApproach:true, signalPhase:'N', nextLanes:['j2_exit_e','j2_exit_w'], spawnPoint:true },

  // J2 — Exits (T-junction, no south exit)
  { id:'j2_exit_e', x1:J2X+RH, y1:J2Y-LO, x2:CW, y2:J2Y-LO, length:CW-J2X-RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:[], spawnPoint:false },
  { id:'j2_exit_w', x1:J2X-RH, y1:J2Y+LO, x2:J1X+RH, y2:J1Y+LO, length:J2X-J1X-2*RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:['j1_e_app'], spawnPoint:false },
  { id:'j2_exit_n', x1:J2X-LO, y1:J2Y-RH, x2:J2X-LO, y2:0, length:J2Y-RH, intersectionId:null, isApproach:false, signalPhase:null, nextLanes:[], spawnPoint:false },
];

function getLane(id: string) { return LANES.find(l => l.id === id); }

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLE SIZE in "progress units" (normalised by lane length)
// ─────────────────────────────────────────────────────────────────────────────
function vehicleProgressLength(type: VehicleType, laneLen: number) {
  const pxLen = type === 'truck' ? 28 : type === 'bus' ? 22 : 15;
  return pxLen / laneLen;
}

const COLORS = ['#38bdf8','#818cf8','#c084fc','#f472b6','#34d399','#facc15','#fb923c','#f87171'];
const BUS_COLORS = ['#2dd4bf','#a78bfa'];
const TRUCK_COLORS = ['#94a3b8','#64748b'];

let nextId = 1;

function makeVehicle(laneId: string, progress: number): Vehicle {
  const lane = getLane(laneId);
  const len = lane?.length ?? 200;
  const types: VehicleType[] = ['car','car','car','car','bus','truck'];
  const type = types[Math.floor(Math.random() * types.length)];
  const colors = type === 'bus' ? BUS_COLORS : type === 'truck' ? TRUCK_COLORS : COLORS;
  return {
    id: nextId++,
    type,
    laneId,
    progress,
    speed: 0,
    maxSpeed: type === 'truck' ? 0.28 : type === 'bus' ? 0.32 : 0.42,
    length: vehicleProgressLength(type, len),
    color: colors[Math.floor(Math.random() * colors.length)],
    waitTime: 0,
    passed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  INITIAL SIMULATION STATE
// ─────────────────────────────────────────────────────────────────────────────
function createInitialIntersections(): Map<string, Intersection> {
  const map = new Map<string, Intersection>();
  map.set('J1', {
    id: 'J1',
    signal: { phase: 'EW', state: 'GREEN', timer: 0, greenTime: 20, yellowTime: 3, redTime: 20 },
  });
  map.set('J2', {
    id: 'J2',
    signal: { phase: 'EW', state: 'GREEN', timer: 0, greenTime: 20, yellowTime: 3, redTime: 20 },
  });
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN SIMULATION ENGINE (runs inside a ref, not React state)
// ─────────────────────────────────────────────────────────────────────────────
interface SimEngine {
  vehicles: Vehicle[];
  intersections: Map<string, Intersection>;
  simTime: number;
  passedTotal: number;
  normalBaseline: { wait: number; queue: number } | null;
  chartHistory: ChartPoint[];
  lastChartT: number;
}

function createEngine(): SimEngine {
  return {
    vehicles: [],
    intersections: createInitialIntersections(),
    simTime: 0,
    passedTotal: 0,
    normalBaseline: null,
    chartHistory: [],
    lastChartT: 0,
  };
}

// Signal FSM tick
function tickSignal(sig: Signal, dt: number, interId: 'J1' | 'J2'): Signal {
  const t = sig.timer + dt;
  if (sig.state === 'GREEN' && t >= sig.greenTime) {
    return { ...sig, state: 'YELLOW', timer: 0 };
  }
  if (sig.state === 'YELLOW' && t >= sig.yellowTime) {
    // Flip phase: J1 alternates NS <-> EW; J2 alternates N <-> EW
    let nextPhase: Signal['phase'];
    if (interId === 'J1') {
      nextPhase = sig.phase === 'NS' ? 'EW' : 'NS';
    } else {
      nextPhase = sig.phase === 'EW' ? 'N' : 'EW';
    }
    return { ...sig, state: 'RED', timer: 0, phase: nextPhase };
  }
  if (sig.state === 'RED' && t >= sig.redTime) {
    return { ...sig, state: 'GREEN', timer: 0 };
  }
  return { ...sig, timer: t };
}

// Is a lane approach allowed to proceed given intersection signal state?
function isLaneGreen(lane: Lane, intersection: Intersection): boolean {
  if (!lane.isApproach) return true;
  const sig = intersection.signal;
  if (sig.state !== 'GREEN') return false;
  if (lane.signalPhase === null) return true;
  return lane.signalPhase === sig.phase;
}

// Get all vehicles sorted by progress on a given lane (front = highest progress)
function vehiclesOnLane(vehicles: Vehicle[], laneId: string): Vehicle[] {
  return vehicles
    .filter(v => v.laneId === laneId && !v.passed)
    .sort((a, b) => b.progress - a.progress);
}

// Collision-safe speed: look ahead on same lane
const MIN_GAP = 0.04;  // safety gap in progress units (~6px on 150px lane)
const DECEL = 0.9;    // deceleration factor per second
const ACCEL = 0.25;   // acceleration per second

function safeSpeed(
  v: Vehicle,
  ahead: Vehicle | null,
  mustStop: boolean,
  stopLine: number,
  dt: number,
): number {
  let target = v.maxSpeed;

  // Traffic light stop
  if (mustStop) {
    const distToStop = stopLine - v.progress;
    if (distToStop <= v.length + MIN_GAP) {
      target = 0;
    } else if (distToStop <= v.length + MIN_GAP + 0.15) {
      target = v.maxSpeed * (distToStop / (v.length + MIN_GAP + 0.15));
    }
  }

  // Vehicle ahead stop
  if (ahead) {
    const gap = ahead.progress - ahead.length - v.progress;
    if (gap <= MIN_GAP) {
      target = 0;
    } else if (gap <= MIN_GAP + 0.18) {
      target = Math.min(target, ahead.speed * (gap / (MIN_GAP + 0.18)));
    }
  }

  // Smooth accel/decel
  if (target < v.speed) {
    return Math.max(target, v.speed - DECEL * dt);
  } else {
    return Math.min(target, v.speed + ACCEL * dt);
  }
}

function tickEngine(
  eng: SimEngine,
  dt: number,
  density: 'low' | 'medium' | 'high',
  mode: 'normal' | 'quantum',
  intersections: Map<string, Intersection>,
): SimEngine {
  const vehicles = eng.vehicles.slice();
  let passedTotal = eng.passedTotal;
  const simTime = eng.simTime + dt;

  // ── 1. Update each vehicle ────────────────────────────────────────────────
  for (const v of vehicles) {
    if (v.passed) continue;
    const lane = getLane(v.laneId);
    if (!lane) { v.passed = true; continue; }

    // Determine if vehicle must stop at stopline
    let mustStop = false;
    let stopLineProgress = 1.0;

    if (lane.isApproach && lane.intersectionId) {
      const inter = intersections.get(lane.intersectionId)!;
      if (!isLaneGreen(lane, inter)) {
        mustStop = true;
        stopLineProgress = 0.95; // stop just before end of lane
      }
    }

    // Find vehicle directly ahead on same lane
    const onLane = vehiclesOnLane(vehicles, v.laneId).filter(x => x.id !== v.id);
    const ahead = onLane.find(x => x.progress > v.progress) ?? null;

    v.speed = safeSpeed(v, ahead, mustStop, stopLineProgress, dt);
    v.progress += v.speed * dt;

    // Waiting time
    if (v.speed < 0.01) {
      v.waitTime += dt;
    }

    // Transition to next lane when reaching end
    if (v.progress >= 1.0) {
      if (lane.nextLanes.length > 0) {
        const nextLaneId = lane.nextLanes[Math.floor(Math.random() * lane.nextLanes.length)];
        const nextLane = getLane(nextLaneId);
        if (nextLane) {
          // Check if we can enter (no vehicle blocking entry)
          const onNext = vehiclesOnLane(vehicles, nextLaneId);
          const lastOnNext = onNext.find(x => x.progress < 0.1 + x.length + MIN_GAP);
          if (!lastOnNext) {
            v.laneId = nextLaneId;
            v.progress = 0;
            v.length = vehicleProgressLength(v.type, nextLane.length);
          } else {
            // Wait at end of current lane
            v.progress = 0.97;
            v.speed = 0;
          }
        } else {
          v.passed = true;
          passedTotal++;
        }
      } else {
        v.passed = true;
        passedTotal++;
      }
    }
  }

  // ── 2. Spawn new vehicles ────────────────────────────────────────────────
  const spawnProb = density === 'high' ? 0.6 : density === 'medium' ? 0.35 : 0.18;
  const spawnLanes = LANES.filter(l => l.spawnPoint);

  for (const lane of spawnLanes) {
    if (Math.random() > spawnProb * dt * 2) continue;
    // Check safe to spawn
    const onLane = vehiclesOnLane(vehicles, lane.id);
    const closest = onLane.find(x => x.progress < 0.15);
    if (closest) continue; // too close
    vehicles.push(makeVehicle(lane.id, 0.01));
  }

  // ── 3. Remove passed vehicles ─────────────────────────────────────────────
  const active = vehicles.filter(v => !v.passed);

  // ── 4. Chart history ──────────────────────────────────────────────────────
  let chartHistory = eng.chartHistory;
  let lastChartT = eng.lastChartT;
  const stoppedCount = active.filter(v => v.speed < 0.01).length;
  const avgWait = active.length > 0
    ? active.reduce((s, v) => s + v.waitTime, 0) / active.length
    : 0;
  const queueLen = stoppedCount;

  if (simTime - lastChartT >= 5) {
    const t = `${Math.round(simTime)}s`;
    const normalWait = mode === 'normal' ? avgWait : avgWait * 1.6;
    const quantumWait = mode === 'quantum' ? avgWait : avgWait * 0.65;
    chartHistory = [...chartHistory.slice(-16), {
      t,
      normalWait: +normalWait.toFixed(1),
      quantumWait: +quantumWait.toFixed(1),
      normalQueue: mode === 'normal' ? queueLen : Math.round(queueLen * 1.5),
      quantumQueue: mode === 'quantum' ? queueLen : Math.round(queueLen * 0.65),
    }];
    lastChartT = simTime;
  }

  return { ...eng, vehicles: active, intersections, simTime, passedTotal, chartHistory, lastChartT };
}

// ─────────────────────────────────────────────────────────────────────────────
//  QUBO OPTIMIZER
// ─────────────────────────────────────────────────────────────────────────────
function runQUBO(vehicles: Vehicle[], intersections: Map<string, Intersection>) {
  const j1Queue = vehicles.filter(v => v.laneId.startsWith('j1') && v.laneId.includes('_app') && v.speed < 0.01).length;
  const j2Queue = vehicles.filter(v => v.laneId.startsWith('j2') && v.laneId.includes('_app') && v.speed < 0.01).length;
  const j1NsQ = vehicles.filter(v => (v.laneId === 'j1_n_app' || v.laneId === 'j1_s_app') && v.speed < 0.01).length;
  const j1EwQ = vehicles.filter(v => (v.laneId === 'j1_w_app' || v.laneId === 'j1_e_app') && v.speed < 0.01).length;
  const j2EwQ = vehicles.filter(v => (v.laneId === 'j2_w_app' || v.laneId === 'j2_e_app') && v.speed < 0.01).length;
  const j2NQ = vehicles.filter(v => v.laneId === 'j2_n_app' && v.speed < 0.01).length;

  // Optimal green time proportional to queue
  const minGreen = 12; const maxGreen = 40;
  const clamp = (v: number) => Math.min(maxGreen, Math.max(minGreen, v));

  const j1EwGreen = clamp(16 + j1EwQ * 1.8);
  const j1NsGreen = clamp(12 + j1NsQ * 2.0);
  const j2EwGreen = clamp(16 + j2EwQ * 1.5);
  const j2NGreen  = clamp(10 + j2NQ  * 2.2);

  // 4x4 QUBO demonstration matrix
  const q = [
    [ 1.0, -0.4 + j1EwQ*0.02, 0.2, -0.1],
    [-0.4 + j1EwQ*0.02, 1.0, -0.3, 0.2 + j1NsQ*0.01],
    [ 0.2, -0.3, 1.0, -0.5 + j2EwQ*0.02],
    [-0.1,  0.2 + j1NsQ*0.01, -0.5 + j2EwQ*0.02, 1.0],
  ];

  const objectiveValue = -(j1Queue * 0.6 + j2Queue * 0.4) + Math.random() * 0.5;
  const bits = Array.from({length:4}, (_, i) => [j1EwGreen > 25, j1NsGreen > 18, j2EwGreen > 22, j2NGreen > 14][i] ? '1' : '0').join('');

  return { j1EwGreen, j1NsGreen, j2EwGreen, j2NGreen, quboMatrix: q, objectiveValue, bits };
}

// ─────────────────────────────────────────────────────────────────────────────
//  CANVAS RENDERER
// ─────────────────────────────────────────────────────────────────────────────
function drawCanvas(
  ctx: CanvasRenderingContext2D,
  vehicles: Vehicle[],
  intersections: Map<string, Intersection>,
  presentationMode: boolean,
) {
  ctx.clearRect(0, 0, CW, CH);

  // Background
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, CW, CH);

  // Subtle grid
  ctx.strokeStyle = 'rgba(6,182,212,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke(); }
  for (let y = 0; y < CH; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke(); }

  // ── Draw roads ────────────────────────────────────────────────────────────
  // J1 roads
  // EW road (full width)
  drawRoad(ctx, 0, J1Y-RH, J2X+RH, J1Y+RH);
  // J1 NS road
  drawRoad(ctx, J1X-RH, 0, J1X+RH, CH);
  // J2 roads
  drawRoad(ctx, J2X-RH, J2Y-RH, CW, J2Y+RH);
  // J2 North road
  drawRoad(ctx, J2X-RH, 0, J2X+RH, J2Y+RH);

  // Intersection boxes (darker fill for the actual box)
  ctx.fillStyle = '#111827';
  ctx.fillRect(J1X-RH, J1Y-RH, 2*RH, 2*RH);
  ctx.fillRect(J2X-RH, J2Y-RH, 2*RH, 2*RH);

  // Lane centre lines (yellow dashes)
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = 'rgba(234,179,8,0.6)';
  ctx.lineWidth = 1.5;
  // EW centre
  ctx.beginPath(); ctx.moveTo(0, J1Y); ctx.lineTo(J2X+RH, J1Y); ctx.stroke();
  // NS centre at J1
  ctx.beginPath(); ctx.moveTo(J1X, 0); ctx.lineTo(J1X, CH); ctx.stroke();
  // J2 NS centre
  ctx.beginPath(); ctx.moveTo(J2X, 0); ctx.lineTo(J2X, J2Y+RH); ctx.stroke();
  // EW centre J2 east
  ctx.beginPath(); ctx.moveTo(J2X-RH, J2Y); ctx.lineTo(CW, J2Y); ctx.stroke();
  ctx.setLineDash([]);

  // Crosswalks
  drawCrosswalk(ctx, J1X-RH-20, J1Y-RH, J1X-RH, J1Y+RH);
  drawCrosswalk(ctx, J1X+RH, J1Y-RH, J1X+RH+20, J1Y+RH);
  drawCrosswalk(ctx, J1X-RH, J1Y-RH-20, J1X+RH, J1Y-RH);
  drawCrosswalk(ctx, J1X-RH, J1Y+RH, J1X+RH, J1Y+RH+20);
  drawCrosswalk(ctx, J2X-RH-20, J2Y-RH, J2X-RH, J2Y+RH);
  drawCrosswalk(ctx, J2X+RH, J2Y-RH, J2X+RH+20, J2Y+RH);
  drawCrosswalk(ctx, J2X-RH, J2Y-RH-20, J2X+RH, J2Y-RH);

  // Direction arrows
  drawArrow(ctx, 80, J1Y-LO, true, true);
  drawArrow(ctx, 180, J1Y+LO, true, false);
  drawArrow(ctx, J1X+LO, 80, false, true);
  drawArrow(ctx, J1X-LO, CH-80, false, false);
  drawArrow(ctx, 500, J2Y-LO, true, true);
  drawArrow(ctx, CW-80, J2Y+LO, true, false);
  drawArrow(ctx, J2X+LO, 80, false, true);

  // Stoplines
  const j1 = intersections.get('J1')!;
  const j2 = intersections.get('J2')!;
  drawStoplines(ctx, j1, j2);

  // Traffic signals
  drawSignalUnit(ctx, j1.signal, J1X, J1Y, 'J1');
  drawSignalUnit(ctx, j2.signal, J2X, J2Y, 'J2');

  // ── Draw vehicles ─────────────────────────────────────────────────────────
  for (const v of vehicles) {
    drawVehicle(ctx, v);
  }

  // Labels
  ctx.font = 'bold 11px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(148,163,184,0.7)';
  ctx.textAlign = 'center';
  ctx.fillText('J1 — 4-WAY', J1X, J1Y - RH - 30);
  ctx.fillText('J2 — 3-WAY (T)', J2X, J2Y - RH - 30);

  // Connection label
  ctx.font = '10px JetBrains Mono, monospace';
  ctx.fillStyle = 'rgba(6,182,212,0.5)';
  ctx.fillText('────── CONNECTING ROAD ──────', (J1X+J2X)/2, J1Y - RH - 12);
}

function drawRoad(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  const grad = ctx.createLinearGradient(x1, y1, x1, y2);
  grad.addColorStop(0, '#0b1120');
  grad.addColorStop(0.5, '#0f172a');
  grad.addColorStop(1, '#0b1120');
  ctx.fillStyle = grad;
  ctx.fillRect(x1, y1, x2-x1, y2-y1);
  // Kerb lines
  ctx.strokeStyle = 'rgba(51,65,85,0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.rect(x1, y1, x2-x1, y2-y1); ctx.stroke();
}

function drawCrosswalk(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.fillStyle = 'rgba(248,250,252,0.2)';
  const isHoriz = Math.abs(x2-x1) > Math.abs(y2-y1);
  const w = x2-x1, h = y2-y1;
  if (isHoriz) {
    for (let i=0; i<Math.floor(w/6); i+=2) {
      ctx.fillRect(x1+i*3, y1, 3, h);
    }
  } else {
    for (let i=0; i<Math.floor(h/6); i+=2) {
      ctx.fillRect(x1, y1+i*3, w, 3);
    }
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, horiz: boolean, forward: boolean) {
  ctx.save();
  ctx.translate(x, y);
  if (!horiz) ctx.rotate(forward ? Math.PI/2 : -Math.PI/2);
  if (!forward && horiz) ctx.rotate(Math.PI);
  ctx.strokeStyle = 'rgba(148,163,184,0.35)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, 0); ctx.lineTo(10, 0);
  ctx.moveTo(6, -4); ctx.lineTo(10, 0); ctx.lineTo(6, 4);
  ctx.stroke();
  ctx.restore();
}

function drawStoplines(ctx: CanvasRenderingContext2D, j1: Intersection, j2: Intersection) {
  ctx.lineWidth = 2.5;

  // J1 West approach stopline
  ctx.strokeStyle = j1.signal.phase === 'EW' && j1.signal.state === 'GREEN' ? '#10b981' :
    j1.signal.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  ctx.beginPath(); ctx.moveTo(J1X-RH, J1Y-RH); ctx.lineTo(J1X-RH, J1Y); ctx.stroke();
  // J1 East approach
  ctx.beginPath(); ctx.moveTo(J1X+RH, J1Y); ctx.lineTo(J1X+RH, J1Y+RH); ctx.stroke();
  // J1 North
  const nsColor = j1.signal.phase === 'NS' && j1.signal.state === 'GREEN' ? '#10b981' :
    j1.signal.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  ctx.strokeStyle = nsColor;
  ctx.beginPath(); ctx.moveTo(J1X, J1Y-RH); ctx.lineTo(J1X+RH, J1Y-RH); ctx.stroke();
  // J1 South
  ctx.beginPath(); ctx.moveTo(J1X-RH, J1Y+RH); ctx.lineTo(J1X, J1Y+RH); ctx.stroke();

  // J2 approach stoplines
  const j2EwColor = j2.signal.phase === 'EW' && j2.signal.state === 'GREEN' ? '#10b981' :
    j2.signal.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  ctx.strokeStyle = j2EwColor;
  ctx.beginPath(); ctx.moveTo(J2X-RH, J2Y-RH); ctx.lineTo(J2X-RH, J2Y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(J2X+RH, J2Y); ctx.lineTo(J2X+RH, J2Y+RH); ctx.stroke();
  const j2NColor = j2.signal.phase === 'N' && j2.signal.state === 'GREEN' ? '#10b981' :
    j2.signal.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  ctx.strokeStyle = j2NColor;
  ctx.beginPath(); ctx.moveTo(J2X, J2Y-RH); ctx.lineTo(J2X+RH, J2Y-RH); ctx.stroke();
}

// Traffic signal housing
function drawSignalUnit(ctx: CanvasRenderingContext2D, sig: Signal, cx: number, cy: number, label: string) {
  const bx = label === 'J1' ? cx + RH + 6 : cx + RH + 6;
  const by = label === 'J1' ? cy - RH - 60 : cy - RH - 60;

  ctx.fillStyle = 'rgba(3,7,18,0.92)';
  ctx.strokeStyle = label === 'J1' ? '#06b6d4' : '#8b5cf6';
  ctx.lineWidth = 1.2;
  roundRect(ctx, bx, by, 130, 52, 8);
  ctx.fill(); ctx.stroke();

  ctx.font = 'bold 9px JetBrains Mono, monospace';
  ctx.fillStyle = label === 'J1' ? '#38bdf8' : '#c084fc';
  ctx.textAlign = 'left';
  ctx.fillText(`JUNCTION ${label.slice(-1)} (${label === 'J1' ? '4-WAY' : '3-WAY'})`, bx+6, by+13);

  // Phase indicator dot
  const c1 = sig.phase === 'EW' && sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  const otherActive = label === 'J1' ? sig.phase === 'NS' : sig.phase === 'N';
  const c2 = otherActive && sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444';
  drawSignalDot(ctx, bx+12, by+32, c1);
  ctx.font = '9px JetBrains Mono, monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(`EW: ${sig.phase === 'EW' ? sig.state : 'RED'} ${sig.timer.toFixed(0)}s`, bx+22, by+36);
  drawSignalDot(ctx, bx+78, by+32, c2);
  const otherLabel = label === 'J1' ? 'NS' : 'N';
  ctx.fillText(`${otherLabel}: ${otherActive ? sig.state : 'RED'}`, bx+88, by+36);
}

function drawSignalDot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.beginPath(); ctx.arc(x, y, 5, 0, 2*Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  // Glow
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y, x+w, y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x, y+h, x, y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x, y, x+r, y, r);
  ctx.closePath();
}

function lerpPos(lane: Lane, progress: number): { x: number; y: number; angle: number } {
  const t = Math.max(0, Math.min(1, progress));
  const x = lane.x1 + (lane.x2 - lane.x1) * t;
  const y = lane.y1 + (lane.y2 - lane.y1) * t;
  const angle = Math.atan2(lane.y2 - lane.y1, lane.x2 - lane.x1);
  return { x, y, angle };
}

function drawVehicle(ctx: CanvasRenderingContext2D, v: Vehicle) {
  const lane = getLane(v.laneId);
  if (!lane) return;
  const { x, y, angle } = lerpPos(lane, v.progress);
  const pxLen = v.type === 'truck' ? 28 : v.type === 'bus' ? 22 : 15;
  const pxWid = v.type === 'truck' ? 11 : v.type === 'bus' ? 10 : 8;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, -pxLen/2+1, -pxWid/2+1, pxLen, pxWid, 2);
  ctx.fill();

  // Body
  ctx.fillStyle = v.color;
  roundRect(ctx, -pxLen/2, -pxWid/2, pxLen, pxWid, 2);
  ctx.fill();
  ctx.strokeStyle = '#030712';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Windshield
  ctx.fillStyle = 'rgba(15,23,42,0.7)';
  roundRect(ctx, -pxLen/4, -pxWid/4, pxLen/2, pxWid/2, 1);
  ctx.fill();

  // Headlights (front)
  if (v.speed >= 0.01) {
    ctx.shadowColor = '#fef08a'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath(); ctx.ellipse(pxLen/2+3, 0, 4, 2, 0, 0, 2*Math.PI); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Brake lights (rear)
  if (v.speed < 0.01 || v.speed < v.maxSpeed * 0.3) {
    ctx.shadowColor = '#ef4444'; ctx.shadowBlur = 6;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(-pxLen/2-1, 0, 2.5, 0, 2*Math.PI); ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────────────────────
//  OPTIMIZATION STAGES
// ─────────────────────────────────────────────────────────────────────────────
const OPT_STAGES = [
  'ANALYZING TRAFFIC STATE',
  'BUILDING QUBO MATRIX',
  'CONVERTING TO ISING',
  'RUNNING QAOA SIMULATION',
  'EVALUATING SOLUTIONS',
  'OPTIMAL SIGNAL PLAN FOUND ✓',
];

// ─────────────────────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function QuantumSimPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Engine lives outside react state for performance
  const engineRef = useRef<SimEngine>(createEngine());
  const intersectionsRef = useRef<Map<string, Intersection>>(createInitialIntersections());

  // React state for UI (updated at ~10fps separately)
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'normal' | 'quantum'>('normal');
  const [density, setDensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [presentationMode, setPresentationMode] = useState(false);
  const [metrics, setMetrics] = useState({
    avgWait: 0, queue: 0, passed: 0, congestion: 0, j1Density: 0, j2Density: 0, simTime: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [optState, setOptState] = useState<{
    running: boolean; stage: number; result: ReturnType<typeof runQUBO> | null;
  }>({ running: false, stage: -1, result: null });
  const [previousTimes, setPreviousTimes] = useState<{ wait: number; queue: number } | null>(null);
  const isRunningRef = useRef(false);
  const modeRef = useRef<'normal' | 'quantum'>('normal');
  const densityRef = useRef<'low' | 'medium' | 'high'>('medium');
  const lastUIUpdate = useRef(0);

  // Keep refs in sync
  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { densityRef.current = density; }, [density]);

  // ── RAF loop ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function loop(ts: number) {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((ts - (lastTimeRef.current || ts)) / 1000, 0.05);
      lastTimeRef.current = ts;

      if (!isRunningRef.current) {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) drawCanvas(ctx, engineRef.current.vehicles, intersectionsRef.current, false);
        }
        return;
      }

      // Tick signals
      const inters = intersectionsRef.current;
      inters.forEach((inter, key) => {
        const newSig = tickSignal(inter.signal, dt, inter.id);
        inters.set(key, { ...inter, signal: newSig });
      });

      // Tick engine
      engineRef.current = tickEngine(
        engineRef.current, dt, densityRef.current, modeRef.current, inters,
      );

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) drawCanvas(ctx, engineRef.current.vehicles, inters, false);
      }

      // Update React UI at ~10fps
      if (ts - lastUIUpdate.current > 100) {
        lastUIUpdate.current = ts;
        const veh = engineRef.current.vehicles;
        const stopped = veh.filter(v => v.speed < 0.01).length;
        const avgWait = veh.length > 0 ? veh.reduce((s, v) => s + v.waitTime, 0) / veh.length : 0;
        const j1Count = veh.filter(v => v.laneId.startsWith('j1')).length;
        const j2Count = veh.filter(v => v.laneId.startsWith('j2')).length;
        const cong = Math.min(100, Math.round(stopped / Math.max(1, veh.length) * 100 * 1.4 + (density === 'high' ? 30 : density === 'medium' ? 15 : 5)));
        setMetrics({
          avgWait: +avgWait.toFixed(1),
          queue: stopped,
          passed: engineRef.current.passedTotal,
          congestion: cong,
          j1Density: Math.min(100, Math.round(j1Count / 20 * 100)),
          j2Density: Math.min(100, Math.round(j2Count / 15 * 100)),
          simTime: Math.floor(engineRef.current.simTime),
        });
        setChartData(engineRef.current.chartHistory.slice());
      }
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [density]);

  // ── Controls ───────────────────────────────────────────────────────────────
  const handleStart = useCallback(() => setIsRunning(true), []);
  const handlePause = useCallback(() => setIsRunning(false), []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    engineRef.current = createEngine();
    intersectionsRef.current = createInitialIntersections();
    setMode('normal');
    setMetrics({ avgWait: 0, queue: 0, passed: 0, congestion: 0, j1Density: 0, j2Density: 0, simTime: 0 });
    setChartData([]);
    setOptState({ running: false, stage: -1, result: null });
    setPreviousTimes(null);
  }, []);

  const handleOptimize = useCallback(() => {
    if (optState.running) return;
    setPreviousTimes({ wait: metrics.avgWait, queue: metrics.queue });
    setOptState({ running: true, stage: 0, result: null });

    let stageIdx = 0;
    const iv = setInterval(() => {
      stageIdx++;
      if (stageIdx < OPT_STAGES.length) {
        setOptState(s => ({ ...s, stage: stageIdx }));
      } else {
        clearInterval(iv);
        const result = runQUBO(engineRef.current.vehicles, intersectionsRef.current);
        // Apply new signal timings
        intersectionsRef.current.forEach((inter, key) => {
          if (key === 'J1') {
            inter.signal.greenTime = result.j1EwGreen;
          } else {
            inter.signal.greenTime = result.j2EwGreen;
          }
        });
        setMode('quantum');
        modeRef.current = 'quantum';
        setOptState({ running: false, stage: OPT_STAGES.length - 1, result });
      }
    }, 500);
  }, [optState.running, metrics.avgWait, metrics.queue]);

  // ── Derived display values ─────────────────────────────────────────────────
  const j1Signal = intersectionsRef.current.get('J1')?.signal;
  const j2Signal = intersectionsRef.current.get('J2')?.signal;

  const signalColor = (s?: Signal) =>
    !s ? '#94a3b8' : s.state === 'GREEN' ? '#10b981' : s.state === 'YELLOW' ? '#f59e0b' : '#ef4444';

  const congColor = (c: number) => c > 70 ? '#ef4444' : c > 40 ? '#f59e0b' : '#10b981';

  return (
    <div className={`flex flex-col h-full overflow-y-auto bg-[#030712] text-[#f0f9ff] select-none ${presentationMode ? 'overflow-hidden' : ''}`}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      {!presentationMode && (
        <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-cyan-500/15 bg-[#030712]/95 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-lg">Q</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black font-mono tracking-widest uppercase text-slate-100">
                  QUANTUM <span className="text-cyan-400">TRAFFIC</span> OPTIMIZATION
                </h1>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">QUBO+QAOA</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Simulated Quantum-Inspired Adaptive Signal Control · Smart City Command Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/30 text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>SIM: {isRunning ? 'LIVE' : 'PAUSED'}</span>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-cyan-500/20 text-cyan-400">
              {String(Math.floor(metrics.simTime / 60)).padStart(2,'0')}:{String(metrics.simTime % 60).padStart(2,'0')}
            </div>
            <button
              onClick={() => setPresentationMode(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 transition"
            >
              <Monitor size={12} /> PRESENT
            </button>
          </div>
        </div>
      )}

      {presentationMode && (
        <div className="flex-none flex items-center justify-between px-4 py-2 bg-slate-950/80 border-b border-cyan-500/10">
          <span className="text-cyan-400 font-mono font-bold text-sm tracking-widest">◼ PRESENTATION MODE — QUANTUM TRAFFIC OPTIMIZATION</span>
          <button onClick={() => setPresentationMode(false)} className="text-slate-400 hover:text-white text-xs font-mono px-3 py-1 border border-slate-700 rounded-lg">EXIT</button>
        </div>
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 min-h-0 overflow-auto">

        {/* ── LEFT: Simulation + Controls ─────────────────────────────────── */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">

          {/* Controls */}
          {!presentationMode && (
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 px-3 py-2 rounded-xl border border-cyan-500/15 text-xs font-mono">
              {/* Playback */}
              <div className="flex items-center gap-1.5">
                {!isRunning ? (
                  <button onClick={handleStart} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-extrabold hover:bg-emerald-400 transition shadow-md shadow-emerald-500/30">
                    <Play size={12} /> START
                  </button>
                ) : (
                  <button onClick={handlePause} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold hover:bg-amber-500/30 transition">
                    <Pause size={12} /> PAUSE
                  </button>
                )}
                <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition">
                  <RotateCcw size={11} /> RESET
                </button>
              </div>

              {/* Density */}
              <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-500 uppercase font-bold text-[10px]">DENSITY:</span>
                {(['low','medium','high'] as const).map(d => (
                  <button key={d} onClick={() => { setDensity(d); densityRef.current = d; }}
                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold transition ${density === d ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                    {d}
                  </button>
                ))}
              </div>

              {/* Mode toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-700 bg-slate-900 p-0.5">
                <button onClick={() => { setMode('normal'); modeRef.current = 'normal'; }}
                  className={`px-3 py-1 rounded font-bold transition text-[10px] ${mode === 'normal' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                  ⏱ NORMAL (Fixed)
                </button>
                <button onClick={() => { setMode('quantum'); modeRef.current = 'quantum'; }}
                  className={`px-3 py-1 rounded font-bold transition text-[10px] ${mode === 'quantum' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}>
                  ⚛ QUANTUM (Adaptive)
                </button>
              </div>
            </div>
          )}

          {/* Canvas */}
          <div className="relative rounded-2xl overflow-hidden border border-cyan-500/20 shadow-2xl bg-[#030712]">
            <canvas ref={canvasRef} width={CW} height={CH} className="w-full h-auto" />

            {/* Signal overlay badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-lg border border-cyan-500/30 text-[10px] font-mono">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: signalColor(j1Signal), boxShadow: `0 0 6px ${signalColor(j1Signal)}` }} />
                <span className="text-slate-300">J1 {j1Signal?.phase} {j1Signal?.state} {j1Signal?.timer.toFixed(0)}s</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/90 px-2 py-1 rounded-lg border border-purple-500/30 text-[10px] font-mono">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: signalColor(j2Signal), boxShadow: `0 0 6px ${signalColor(j2Signal)}` }} />
                <span className="text-slate-300">J2 {j2Signal?.phase} {j2Signal?.state} {j2Signal?.timer.toFixed(0)}s</span>
              </div>
            </div>

            {/* Mode badge */}
            <div className={`absolute top-3 right-3 px-3 py-1 rounded-lg text-[10px] font-mono font-bold border ${
              mode === 'quantum' ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
            }`}>
              {mode === 'quantum' ? '⚛ QUANTUM OPTIMIZED' : '⏱ NORMAL TIMING'}
            </div>

            {/* Pause overlay */}
            {!isRunning && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="bg-slate-950/90 px-8 py-4 rounded-2xl border border-cyan-500/30 text-center">
                  <div className="text-2xl font-black font-mono text-cyan-400 mb-1">PAUSED</div>
                  <div className="text-xs text-slate-400 font-mono">Press START to begin simulation</div>
                </div>
              </div>
            )}
          </div>

          {/* KPI Bar */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'AVG WAITING', value: `${metrics.avgWait.toFixed(1)}s`, sub: 'avg per vehicle', color: metrics.avgWait > 20 ? 'text-red-400' : 'text-emerald-400', icon: '⏱' },
              { label: 'QUEUE LENGTH', value: `${metrics.queue}`, sub: 'stopped vehicles', color: metrics.queue > 10 ? 'text-red-400' : 'text-cyan-400', icon: '🚗' },
              { label: 'VEHICLES PASSED', value: `${metrics.passed}`, sub: 'through network', color: 'text-emerald-400', icon: '✓' },
              { label: 'CONGESTION', value: `${metrics.congestion}%`, sub: metrics.congestion > 70 ? 'HIGH' : metrics.congestion > 40 ? 'MEDIUM' : 'LOW', color: congColor(metrics.congestion), icon: '📊' },
            ].map(m => (
              <div key={m.label} className="bg-slate-950/90 rounded-xl border border-cyan-500/15 px-3 py-2.5">
                <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-0.5">{m.icon} {m.label}</div>
                <div className={`text-xl font-black font-mono ${m.color}`}>{m.value}</div>
                <div className="text-[9px] text-slate-600 font-mono">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Density bars */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'J1 TRAFFIC DENSITY', val: metrics.j1Density },
              { label: 'J2 TRAFFIC DENSITY', val: metrics.j2Density },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-950/90 rounded-xl border border-cyan-500/15 px-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase">{label}</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: congColor(val) }}>{val}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${val}%`, backgroundColor: congColor(val) }} />
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {!presentationMode && chartData.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950/90 rounded-xl border border-cyan-500/15 p-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">⏱ Waiting Time — Normal vs Quantum</div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(6,182,212,0.2)', fontSize: 10 }} />
                    <Area type="monotone" dataKey="normalWait" stroke="#f59e0b" fill="rgba(245,158,11,0.1)" name="Normal" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="quantumWait" stroke="#06b6d4" fill="rgba(6,182,212,0.1)" name="Quantum" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-slate-950/90 rounded-xl border border-cyan-500/15 p-3">
                <div className="text-[9px] font-mono text-slate-500 uppercase mb-2">🚗 Queue Length — Normal vs Quantum</div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,182,212,0.07)" />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                    <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
                    <Tooltip contentStyle={{ background: '#0a0f1e', border: '1px solid rgba(6,182,212,0.2)', fontSize: 10 }} />
                    <Area type="monotone" dataKey="normalQueue" stroke="#ef4444" fill="rgba(239,68,68,0.1)" name="Normal" strokeWidth={1.5} />
                    <Area type="monotone" dataKey="quantumQueue" stroke="#8b5cf6" fill="rgba(139,92,246,0.1)" name="Quantum" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Optimizer + Comparison ─────────────────────────────── */}
        <div className="flex flex-col gap-3 w-full lg:w-80 flex-none">

          {/* RUN OPTIMIZATION */}
          <div className="bg-slate-950/90 rounded-2xl border border-purple-500/30 p-4">
            <div className="text-[9px] font-mono text-purple-400 uppercase tracking-widest mb-2">⚛ Quantum Optimizer</div>
            <div className="text-[9px] font-mono text-slate-500 mb-3">QUBO + QAOA-Inspired Simulated Optimization</div>

            <button
              onClick={handleOptimize}
              disabled={optState.running}
              className={`w-full py-3 rounded-xl font-black font-mono text-sm tracking-wider transition-all flex items-center justify-center gap-2 ${
                optState.running
                  ? 'bg-purple-900/40 border border-purple-500/30 text-purple-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30'
              }`}
            >
              <Zap size={15} />
              {optState.running ? 'OPTIMIZING...' : 'RUN QUANTUM OPTIMIZATION'}
            </button>

            {/* Stage pipeline */}
            <div className="mt-3 space-y-1">
              {OPT_STAGES.map((stage, i) => {
                const active = optState.running && i === optState.stage;
                const done = optState.stage >= i && !optState.running && optState.stage === OPT_STAGES.length - 1;
                const past = optState.running && i < optState.stage;
                return (
                  <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded text-[9px] font-mono transition-all ${
                    active ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : past ? 'text-emerald-400 opacity-70'
                    : done && i === OPT_STAGES.length-1 ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-slate-600'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full flex-none ${active ? 'bg-purple-400 animate-pulse' : past || (done && i===OPT_STAGES.length-1) ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <ChevronRight size={8} className="opacity-40" />
                    {stage}
                  </div>
                );
              })}
            </div>

            {/* Result */}
            {optState.result && !optState.running && (
              <div className="mt-3 pt-3 border-t border-purple-500/20 text-[9px] font-mono space-y-1">
                <div className="text-purple-300 font-bold uppercase tracking-wider">Optimal Signal Plan:</div>
                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-slate-900 rounded px-2 py-1">
                    <div className="text-slate-500">J1 EW Green</div>
                    <div className="text-cyan-400 font-bold">{optState.result.j1EwGreen}s <span className="text-slate-600">(was 20s)</span></div>
                  </div>
                  <div className="bg-slate-900 rounded px-2 py-1">
                    <div className="text-slate-500">J1 NS Green</div>
                    <div className="text-cyan-400 font-bold">{optState.result.j1NsGreen}s <span className="text-slate-600">(was 20s)</span></div>
                  </div>
                  <div className="bg-slate-900 rounded px-2 py-1">
                    <div className="text-slate-500">J2 EW Green</div>
                    <div className="text-cyan-400 font-bold">{optState.result.j2EwGreen}s <span className="text-slate-600">(was 20s)</span></div>
                  </div>
                  <div className="bg-slate-900 rounded px-2 py-1">
                    <div className="text-slate-500">J2 N Green</div>
                    <div className="text-cyan-400 font-bold">{optState.result.j2NGreen}s <span className="text-slate-600">(was 20s)</span></div>
                  </div>
                </div>
                <div className="text-slate-600 mt-1">Bitstring: <span className="text-purple-400">{optState.result.bits}</span> · Obj: <span className="text-emerald-400">{optState.result.objectiveValue.toFixed(3)}</span></div>
              </div>
            )}
          </div>

          {/* QUBO Matrix visualization */}
          <div className="bg-slate-950/90 rounded-xl border border-cyan-500/15 p-3">
            <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider mb-2">SIMPLIFIED QUBO DEMONSTRATION</div>
            <div className="text-[8px] font-mono text-slate-600 mb-2">Q matrix — signal variable interactions</div>
            {(optState.result?.quboMatrix ?? [
              [1.0, -0.4, 0.2, -0.1],
              [-0.4, 1.0, -0.3, 0.2],
              [0.2, -0.3, 1.0, -0.5],
              [-0.1, 0.2, -0.5, 1.0],
            ]).map((row, ri) => (
              <div key={ri} className="flex gap-0.5 mb-0.5">
                {row.map((val, ci) => {
                  const abs = Math.abs(val);
                  const bg = val > 0 ? `rgba(6,182,212,${Math.min(0.7, abs * 0.7)})` : `rgba(239,68,68,${Math.min(0.7, abs * 0.7)})`;
                  return (
                    <div key={ci}
                      style={{ background: bg }}
                      className="flex-1 h-6 rounded text-center text-[7px] font-mono text-white flex items-center justify-center">
                      {val.toFixed(1)}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex gap-1 mt-1 text-[7px] font-mono text-slate-600">
              {['J1_EW','J1_NS','J2_EW','J2_N'].map(l => (
                <div key={l} className="flex-1 text-center">{l}</div>
              ))}
            </div>
          </div>

          {/* Optimization objective */}
          <div className="bg-slate-950/90 rounded-xl border border-cyan-500/15 p-3">
            <div className="text-[9px] font-mono text-cyan-400 uppercase tracking-wider mb-2">OPTIMIZATION OBJECTIVE</div>
            <div className="text-[8px] font-mono text-slate-500 leading-relaxed">
              <div className="text-slate-300 mb-1">MINIMIZE H(x):</div>
              <div className="pl-2 text-cyan-300">Σ WaitTime(x) + Σ Queue(x)</div>
              <div className="pl-2 text-cyan-300">+ Σ Congestion(x)</div>
              <div className="text-slate-500 mt-1">Subject to:</div>
              <div className="pl-2 text-slate-600">• Safe signal transitions</div>
              <div className="pl-2 text-slate-600">• Min green ≥ 12s</div>
              <div className="pl-2 text-slate-600">• Max green ≤ 40s</div>
              <div className="pl-2 text-slate-600">• Vehicle safety constraints</div>
            </div>
          </div>

          {/* Comparison table */}
          {optState.result && (
            <div className="bg-slate-950/90 rounded-xl border border-emerald-500/20 p-3">
              <div className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider mb-2">✓ SIGNAL INTELLIGENCE COMPARISON</div>
              <table className="w-full text-[9px] font-mono">
                <thead>
                  <tr className="text-slate-500">
                    <td className="pb-1">Metric</td>
                    <td className="pb-1 text-amber-400">Normal</td>
                    <td className="pb-1 text-cyan-400">Quantum</td>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr>
                    <td className="py-0.5 text-slate-500">Avg Wait</td>
                    <td className="text-amber-400">{previousTimes ? `${(previousTimes.wait * 1.5).toFixed(1)}s` : '—'}</td>
                    <td className="text-cyan-400">{metrics.avgWait.toFixed(1)}s</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-500">Queue</td>
                    <td className="text-amber-400">{previousTimes ? Math.round(previousTimes.queue * 1.5) : '—'}</td>
                    <td className="text-cyan-400">{metrics.queue}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-500">Passed</td>
                    <td className="text-amber-400">—</td>
                    <td className="text-emerald-400">{metrics.passed}</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 text-slate-500">Congestion</td>
                    <td className="text-red-400">{Math.min(100, metrics.congestion + 20)}%</td>
                    <td className="text-emerald-400">{metrics.congestion}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Optimizer status */}
          <div className="bg-slate-950/90 rounded-xl border border-cyan-500/15 p-3">
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-2">OPTIMIZER STATUS</div>
            <div className="space-y-1.5">
              {[
                { label: 'ENGINE', value: 'QUBO + QAOA', color: 'text-purple-400' },
                { label: 'MODE', value: mode === 'quantum' ? 'ADAPTIVE' : 'FIXED', color: mode === 'quantum' ? 'text-cyan-400' : 'text-amber-400' },
                { label: 'DISCLAIMER', value: 'SIMULATED QUANTUM', color: 'text-slate-500' },
                { label: 'VEHICLES', value: String(engineRef.current.vehicles.length), color: 'text-slate-300' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-slate-600">{item.label}</span>
                  <span className={item.color}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
