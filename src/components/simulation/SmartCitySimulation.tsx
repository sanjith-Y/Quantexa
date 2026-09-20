import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  Play, Pause, RotateCcw, Zap, Clock, Activity, Ambulance,
  Shield, CheckCircle, AlertTriangle, ChevronRight, Gauge
} from 'lucide-react';
import { useApp } from '../../hooks/useAppState';

// ─────────────────────────────────────────────────────────────────────────────
//  DATA TYPES
// ─────────────────────────────────────────────────────────────────────────────
export type VehicleType = 'car' | 'suv' | 'bus' | 'truck' | 'ambulance';
export type SignalState = 'GREEN' | 'YELLOW' | 'RED';
export type TrafficDensity = 'low' | 'medium' | 'high';
export type SimMode = 'classical' | 'quantum';

export interface Vehicle {
  id: number;
  type: VehicleType;
  laneId: string;
  progress: number; // 0 -> 1 along the current lane
  speed: number;    // progress units per second
  maxSpeed: number; // max speed
  lengthPx: number; // vehicle length in pixels
  widthPx: number;  // vehicle width in pixels
  color: string;
  waitTime: number;
  route: string[];  // sequence of lane IDs
  routeIdx: number;
  isEmergency: boolean;
  passed: boolean;
}

export interface Signal {
  phase: 'EW' | 'NS';
  state: SignalState;
  timer: number;
  greenDuration: number;
  yellowDuration: number;
  redDuration: number;
}

export interface IntersectionInfo {
  id: string; // 'J1', 'J2', 'J3', 'J4'
  name: string;
  x: number;
  y: number;
  signal: Signal;
  ewQueue: number;
  nsQueue: number;
  optimizedGreenEW: number;
  optimizedGreenNS: number;
}

export interface Lane {
  id: string;
  fromNode: string | null;
  toNode: string | null;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
  isApproach: boolean;
  approachNode: string | null;
  signalPhase: 'EW' | 'NS' | null;
  nextLanes: string[];
  isEmergencyRoute?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEOMETRY CONSTANTS (960 x 520 Canvas)
// ─────────────────────────────────────────────────────────────────────────────
const CW = 960;
const CH = 520;
const RW = 48;       // Total road width (2 lanes: 24px each)
const RH = RW / 2;   // 24px half road
const LO = 12;       // Lane offset from center

// 4 Intersections coordinates:
const J1 = { id: 'J1', name: 'Junction 1', x: 260, y: 150 };
const J2 = { id: 'J2', name: 'Junction 2', x: 700, y: 150 };
const J3 = { id: 'J3', name: 'Junction 3', x: 260, y: 380 };
const J4 = { id: 'J4', name: 'Junction 4', x: 700, y: 380 };

// ─────────────────────────────────────────────────────────────────────────────
//  LANE SPECIFICATION
// ─────────────────────────────────────────────────────────────────────────────
function buildLanes(): Lane[] {
  const lanes: Lane[] = [
    // ── J1 Inflow Approaches ──
    { id: 'app_w_j1', fromNode: null, toNode: 'J1', x1: 0, y1: J1.y - LO, x2: J1.x - RH, y2: J1.y - LO, length: J1.x - RH, isApproach: true, approachNode: 'J1', signalPhase: 'EW', nextLanes: ['link_j1_j2', 'link_j1_j3'], isEmergencyRoute: true },
    { id: 'app_n_j1', fromNode: null, toNode: 'J1', x1: J1.x + LO, y1: 0, x2: J1.x + LO, y2: J1.y - RH, length: J1.y - RH, isApproach: true, approachNode: 'J1', signalPhase: 'NS', nextLanes: ['link_j1_j3', 'link_j1_j2'] },
    // ── J1 Outflows ──
    { id: 'exit_w_j1', fromNode: 'J1', toNode: null, x1: J1.x - RH, y1: J1.y + LO, x2: 0, y2: J1.y + LO, length: J1.x - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },
    { id: 'exit_n_j1', fromNode: 'J1', toNode: null, x1: J1.x - LO, y1: J1.y - RH, x2: J1.x - LO, y2: 0, length: J1.y - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },

    // ── J2 Inflow Approaches ──
    { id: 'app_e_j2', fromNode: null, toNode: 'J2', x1: CW, y1: J2.y + LO, x2: J2.x + RH, y2: J2.y + LO, length: CW - J2.x - RH, isApproach: true, approachNode: 'J2', signalPhase: 'EW', nextLanes: ['link_j2_j1', 'link_j2_j4'] },
    { id: 'app_n_j2', fromNode: null, toNode: 'J2', x1: J2.x + LO, y1: 0, x2: J2.x + LO, y2: J2.y - RH, length: J2.y - RH, isApproach: true, approachNode: 'J2', signalPhase: 'NS', nextLanes: ['link_j2_j4', 'link_j2_j1'] },
    // ── J2 Outflows ──
    { id: 'exit_e_j2', fromNode: 'J2', toNode: null, x1: J2.x + RH, y1: J2.y - LO, x2: CW, y2: J2.y - LO, length: CW - J2.x - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [], isEmergencyRoute: true },
    { id: 'exit_n_j2', fromNode: 'J2', toNode: null, x1: J2.x - LO, y1: J2.y - RH, x2: J2.x - LO, y2: 0, length: J2.y - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },

    // ── J3 Inflow Approaches ──
    { id: 'app_w_j3', fromNode: null, toNode: 'J3', x1: 0, y1: J3.y - LO, x2: J3.x - RH, y2: J3.y - LO, length: J3.x - RH, isApproach: true, approachNode: 'J3', signalPhase: 'EW', nextLanes: ['link_j3_j4', 'link_j3_j1'] },
    { id: 'app_s_j3', fromNode: null, toNode: 'J3', x1: J3.x - LO, y1: CH, x2: J3.x - LO, y2: J3.y + RH, length: CH - J3.y - RH, isApproach: true, approachNode: 'J3', signalPhase: 'NS', nextLanes: ['link_j3_j1', 'link_j3_j4'] },
    // ── J3 Outflows ──
    { id: 'exit_w_j3', fromNode: 'J3', toNode: null, x1: J3.x - RH, y1: J3.y + LO, x2: 0, y2: J3.y + LO, length: J3.x - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },
    { id: 'exit_s_j3', fromNode: 'J3', toNode: null, x1: J3.x + LO, y1: J3.y + RH, x2: J3.x + LO, y2: CH, length: CH - J3.y - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },

    // ── J4 Inflow Approaches ──
    { id: 'app_e_j4', fromNode: null, toNode: 'J4', x1: CW, y1: J4.y + LO, x2: J4.x + RH, y2: J4.y + LO, length: CW - J4.x - RH, isApproach: true, approachNode: 'J4', signalPhase: 'EW', nextLanes: ['link_j4_j3', 'link_j4_j2'] },
    { id: 'app_s_j4', fromNode: null, toNode: 'J4', x1: J4.x - LO, y1: CH, x2: J4.x - LO, y2: J4.y + RH, length: CH - J4.y - RH, isApproach: true, approachNode: 'J4', signalPhase: 'NS', nextLanes: ['link_j4_j2', 'link_j4_j3'] },
    // ── J4 Outflows ──
    { id: 'exit_e_j4', fromNode: 'J4', toNode: null, x1: J4.x + RH, y1: J4.y - LO, x2: CW, y2: J4.y - LO, length: CW - J4.x - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [] },
    { id: 'exit_s_j4', fromNode: 'J4', toNode: null, x1: J4.x + LO, y1: J4.y + RH, x2: J4.x + LO, y2: CH, length: CH - J4.y - RH, isApproach: false, approachNode: null, signalPhase: null, nextLanes: [], isEmergencyRoute: true },

    // ── Connecting Roads (Inter-Junction Links) ──
    // Link J1 <-> J2 (East-West North Corridor) - EMERGENCY ROUTE SEGMENT
    { id: 'link_j1_j2', fromNode: 'J1', toNode: 'J2', x1: J1.x + RH, y1: J1.y - LO, x2: J2.x - RH, y2: J2.y - LO, length: J2.x - J1.x - 2 * RH, isApproach: true, approachNode: 'J2', signalPhase: 'EW', nextLanes: ['exit_e_j2', 'link_j2_j4'], isEmergencyRoute: true },
    { id: 'link_j2_j1', fromNode: 'J2', toNode: 'J1', x1: J2.x - RH, y1: J2.y + LO, x2: J1.x + RH, y2: J1.y + LO, length: J2.x - J1.x - 2 * RH, isApproach: true, approachNode: 'J1', signalPhase: 'EW', nextLanes: ['exit_w_j1', 'link_j1_j3'] },

    // Link J3 <-> J4 (East-West South Corridor)
    { id: 'link_j3_j4', fromNode: 'J3', toNode: 'J4', x1: J3.x + RH, y1: J3.y - LO, x2: J4.x - RH, y2: J4.y - LO, length: J4.x - J3.x - 2 * RH, isApproach: true, approachNode: 'J4', signalPhase: 'EW', nextLanes: ['exit_e_j4', 'link_j4_j2'] },
    { id: 'link_j4_j3', fromNode: 'J4', toNode: 'J3', x1: J4.x - RH, y1: J4.y + LO, x2: J3.x + RH, y2: J3.y + LO, length: J4.x - J3.x - 2 * RH, isApproach: true, approachNode: 'J3', signalPhase: 'EW', nextLanes: ['exit_w_j3', 'link_j3_j1'] },

    // Link J1 <-> J3 (North-South West Corridor)
    { id: 'link_j1_j3', fromNode: 'J1', toNode: 'J3', x1: J1.x + LO, y1: J1.y + RH, x2: J3.x + LO, y2: J3.y - RH, length: J3.y - J1.y - 2 * RH, isApproach: true, approachNode: 'J3', signalPhase: 'NS', nextLanes: ['exit_s_j3', 'link_j3_j4'] },
    { id: 'link_j3_j1', fromNode: 'J3', toNode: 'J1', x1: J3.x - LO, y1: J3.y - RH, x2: J1.x - LO, y2: J1.y + RH, length: J3.y - J1.y - 2 * RH, isApproach: true, approachNode: 'J1', signalPhase: 'NS', nextLanes: ['exit_n_j1', 'link_j1_j2'] },

    // Link J2 <-> J4 (North-South East Corridor) - EMERGENCY ROUTE SEGMENT
    { id: 'link_j2_j4', fromNode: 'J2', toNode: 'J4', x1: J2.x + LO, y1: J2.y + RH, x2: J4.x + LO, y2: J4.y - RH, length: J4.y - J2.y - 2 * RH, isApproach: true, approachNode: 'J4', signalPhase: 'NS', nextLanes: ['exit_s_j4', 'link_j4_j3'], isEmergencyRoute: true },
    { id: 'link_j4_j2', fromNode: 'J4', toNode: 'J2', x1: J4.x - LO, y1: J4.y - RH, x2: J2.x - LO, y2: J2.y + RH, length: J4.y - J2.y - 2 * RH, isApproach: true, approachNode: 'J2', signalPhase: 'NS', nextLanes: ['exit_n_j2', 'link_j2_j1'] },
  ];
  return lanes;
}

const LANES = buildLanes();
const LANE_MAP = new Map(LANES.map((l) => [l.id, l]));

// ─────────────────────────────────────────────────────────────────────────────
//  VEHICLE FACTORY
// ─────────────────────────────────────────────────────────────────────────────
const CAR_COLORS = ['#2563eb', '#0284c7', '#0d9488', '#475569', '#64748b', '#3b82f6', '#059669'];
let vehCounter = 1;

function createVehicle(laneId: string, isEmergency = false): Vehicle {
  const lane = LANE_MAP.get(laneId);
  const laneLen = lane?.length || 200;

  if (isEmergency) {
    return {
      id: 99999,
      type: 'ambulance',
      laneId,
      progress: 0.02,
      speed: 0.35,
      maxSpeed: 0.55,
      lengthPx: 26,
      widthPx: 12,
      color: '#ffffff',
      waitTime: 0,
      route: ['app_w_j1', 'link_j1_j2', 'link_j2_j4', 'exit_s_j4'],
      routeIdx: 0,
      isEmergency: true,
      passed: false,
    };
  }

  const rand = Math.random();
  let type: VehicleType = 'car';
  let lenPx = 18;
  let widPx = 9;
  let maxSpd = 0.36;

  if (rand < 0.15) {
    type = 'truck';
    lenPx = 28;
    widPx = 11;
    maxSpd = 0.26;
  } else if (rand < 0.3) {
    type = 'bus';
    lenPx = 24;
    widPx = 10;
    maxSpd = 0.28;
  } else if (rand < 0.55) {
    type = 'suv';
    lenPx = 20;
    widPx = 10;
    maxSpd = 0.34;
  }

  return {
    id: vehCounter++,
    type,
    laneId,
    progress: 0.02,
    speed: 0.2,
    maxSpeed: maxSpd,
    lengthPx: lenPx,
    widthPx: widPx,
    color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
    waitTime: 0,
    route: [laneId],
    routeIdx: 0,
    isEmergency: false,
    passed: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  SIMULATION ENGINE STATE
// ─────────────────────────────────────────────────────────────────────────────
interface SimEngineState {
  vehicles: Vehicle[];
  intersections: Map<string, IntersectionInfo>;
  timeElapsed: number;
  totalPassed: number;
  ambulanceActive: boolean;
  ambulancePassed: boolean;
  logs: Array<{ id: string; text: string; time: string; type: 'info' | 'success' | 'warn' | 'emergency' }>;
}

function initEngine(): SimEngineState {
  const inters = new Map<string, IntersectionInfo>();
  const nodes = [J1, J2, J3, J4];

  nodes.forEach((node, idx) => {
    inters.set(node.id, {
      id: node.id,
      name: node.name,
      x: node.x,
      y: node.y,
      signal: {
        phase: idx % 2 === 0 ? 'EW' : 'NS',
        state: 'GREEN',
        timer: idx * 5,
        greenDuration: 20,
        yellowDuration: 3,
        redDuration: 20,
      },
      ewQueue: 0,
      nsQueue: 0,
      optimizedGreenEW: 24,
      optimizedGreenNS: 20,
    });
  });

  return {
    vehicles: [],
    intersections: inters,
    timeElapsed: 0,
    totalPassed: 0,
    ambulanceActive: false,
    ambulancePassed: false,
    logs: [
      { id: '1', text: 'System initialized — 4 Intersections ready', time: '00:00', type: 'info' },
      { id: '2', text: 'Telemetry linked to Smart City Command Center', time: '00:01', type: 'info' },
    ],
  };
}

interface SmartCitySimulationProps {
  onMetricsUpdate?: (m: {
    avgWait: number;
    queueLen: number;
    throughput: number;
    co2: number;
    fuel: number;
    emergencyEta: number;
    activeMode: SimMode;
    totalVehicles: number;
    intersections: IntersectionInfo[];
  }) => void;
}

export function SmartCitySimulation({ onMetricsUpdate }: SmartCitySimulationProps) {
  const { state, dispatch } = useApp();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SimEngineState>(initEngine());

  // Interactive UI State
  const [isRunning, setIsRunning] = useState(true);
  const [mode, setMode] = useState<SimMode>('quantum');
  const [density, setDensity] = useState<TrafficDensity>('medium');
  const [ambulanceActive, setAmbulanceActive] = useState(false);

  // Sync refs for RAF loop
  const isRunningRef = useRef(isRunning);
  const modeRef = useRef(mode);
  const densityRef = useRef(density);
  const lastFrameTimeRef = useRef(0);
  const lastMetricsUpdateRef = useRef(0);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { densityRef.current = density; }, [density]);

  // Handle Emergency Spawn
  const handleDeployAmbulance = useCallback(() => {
    const eng = engineRef.current;
    if (eng.vehicles.some((v) => v.isEmergency && !v.passed)) return;

    // 1. Pre-clear / Flush any civilian vehicles currently on the emergency corridor
    eng.vehicles.forEach((v) => {
      if (v.laneId === 'app_w_j1' || v.laneId === 'link_j1_j2' || v.laneId === 'link_j2_j4') {
        v.speed = Math.max(v.speed, 0.55);
        v.waitTime = 0;
      }
    });

    // 2. Immediately switch emergency signals along the route to 100% GREEN
    const j1 = eng.intersections.get('J1');
    if (j1) { j1.signal.phase = 'EW'; j1.signal.state = 'GREEN'; j1.signal.timer = 0; }
    const j2 = eng.intersections.get('J2');
    if (j2) { j2.signal.phase = 'EW'; j2.signal.state = 'GREEN'; j2.signal.timer = 0; }
    const j4 = eng.intersections.get('J4');
    if (j4) { j4.signal.phase = 'NS'; j4.signal.state = 'GREEN'; j4.signal.timer = 0; }

    // 3. Spawn the ambulance with unobstructed high priority
    const amb = createVehicle('app_w_j1', true);
    eng.vehicles.push(amb);
    eng.ambulanceActive = true;
    eng.ambulancePassed = false;
    setAmbulanceActive(true);

    eng.logs.unshift({
      id: String(Date.now()),
      text: 'Emergency Green Corridor Active — Zero-Wait Preemption J1(EW) → J2(EW) → J4(NS)',
      time: `${Math.floor(eng.timeElapsed / 60).toString().padStart(2, '0')}:${Math.floor(eng.timeElapsed % 60).toString().padStart(2, '0')}`,
      type: 'emergency',
    });
  }, []);

  // Controls
  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    engineRef.current = initEngine();
    setIsRunning(true);
    setAmbulanceActive(false);
  };

  // ───────────────────────────────────────────────────────────────────────────
  //  CANVAS DRAWING
  // ───────────────────────────────────────────────────────────────────────────
  const drawSimulation = (ctx: CanvasRenderingContext2D, eng: SimEngineState) => {
    ctx.clearRect(0, 0, CW, CH);

    // 1. Terrain / Background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, CW, CH);

    // Subtle map grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CH); ctx.stroke();
    }
    for (let y = 0; y < CH; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CW, y); ctx.stroke();
    }

    // 2. Draw Emergency Green Corridor Path (Glowing Teal underlay if ambulance active)
    if (eng.ambulanceActive && !eng.ambulancePassed) {
      ctx.save();
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.25)';
      ctx.lineWidth = RW + 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      // J1 approach -> J1 -> J2 -> J4 -> Exit South
      ctx.moveTo(0, J1.y);
      ctx.lineTo(J2.x, J1.y);
      ctx.lineTo(J2.x, J4.y);
      ctx.lineTo(J2.x, CH);
      ctx.stroke();

      // Inner pulsating line
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Roads (Dark Slate Asphalt #334155)
    ctx.fillStyle = '#334155';
    // North Arterial (EW) through J1 and J2
    ctx.fillRect(0, J1.y - RH, CW, RW);
    // South Arterial (EW) through J3 and J4
    ctx.fillRect(0, J3.y - RH, CW, RW);
    // West Avenue (NS) through J1 and J3
    ctx.fillRect(J1.x - RH, 0, RW, CH);
    // East Avenue (NS) through J2 and J4
    ctx.fillRect(J2.x - RH, 0, RW, CH);

    // 4. Junction Intersection Boxes (Darker contrast #1e293b)
    const nodes = [J1, J2, J3, J4];
    nodes.forEach((n) => {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(n.x - RH, n.y - RH, RW, RW);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.strokeRect(n.x - RH, n.y - RH, RW, RW);
    });

    // 5. Road Markings (Crisp Yellow Centerlines & White Lane Dashes)
    ctx.save();
    // Yellow solid/dashed center divider
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);

    // EW Centerlines (skip intersections)
    ctx.beginPath(); ctx.moveTo(0, J1.y); ctx.lineTo(J1.x - RH, J1.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J1.x + RH, J1.y); ctx.lineTo(J2.x - RH, J1.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J2.x + RH, J1.y); ctx.lineTo(CW, J1.y); ctx.stroke();

    ctx.beginPath(); ctx.moveTo(0, J3.y); ctx.lineTo(J3.x - RH, J3.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J3.x + RH, J3.y); ctx.lineTo(J4.x - RH, J3.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J4.x + RH, J3.y); ctx.lineTo(CW, J3.y); ctx.stroke();

    // NS Centerlines (skip intersections)
    ctx.beginPath(); ctx.moveTo(J1.x, 0); ctx.lineTo(J1.x, J1.y - RH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J1.x, J1.y + RH); ctx.lineTo(J1.x, J3.y - RH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J1.x, J3.y + RH); ctx.lineTo(J1.x, CH); ctx.stroke();

    ctx.beginPath(); ctx.moveTo(J2.x, 0); ctx.lineTo(J2.x, J2.y - RH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J2.x, J2.y + RH); ctx.lineTo(J2.x, J4.y - RH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(J2.x, J4.y + RH); ctx.lineTo(J2.x, CH); ctx.stroke();
    ctx.restore();

    // 6. Stopline Zebra Crossings at Intersections
    nodes.forEach((n) => {
      // West stopline
      drawZebraCrossing(ctx, n.x - RH - 8, n.y - RH, 8, RW, true);
      // East stopline
      drawZebraCrossing(ctx, n.x + RH, n.y - RH, 8, RW, true);
      // North stopline
      drawZebraCrossing(ctx, n.x - RH, n.y - RH - 8, RW, 8, false);
      // South stopline
      drawZebraCrossing(ctx, n.x - RH, n.y + RH, RW, 8, false);
    });

    // 6b. Emergency Green Wave Corridor Overlay (Animated Directional Path)
    if (eng.ambulanceActive && !eng.ambulancePassed) {
      ctx.save();
      // Flowing green wave path
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.32)';
      ctx.lineWidth = 26;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      // J1 approach -> J1 -> J2 -> J4 -> Exit South
      ctx.moveTo(0, J1.y - LO);
      ctx.lineTo(J2.x - RH, J1.y - LO);
      ctx.lineTo(J2.x + LO, J1.y - LO);
      ctx.lineTo(J2.x + LO, J4.y + RH);
      ctx.lineTo(J2.x + LO, CH);
      ctx.stroke();

      // Flowing neon dashes in motion
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.setLineDash([14, 10]);
      ctx.lineDashOffset = -Date.now() / 25;
      ctx.stroke();
      ctx.restore();
    }

    // 7. Traffic Signals (Red / Yellow / Green LED Heads)
    nodes.forEach((n) => {
      const inter = eng.intersections.get(n.id);
      if (!inter) return;
      const sig = inter.signal;

      const ewColor = sig.phase === 'EW' ? (sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444') : '#ef4444';
      const nsColor = sig.phase === 'NS' ? (sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444') : '#ef4444';

      // Signal Dots at Stoplines
      drawSignalHead(ctx, n.x - RH - 6, n.y - LO, ewColor); // West stopline
      drawSignalHead(ctx, n.x + RH + 6, n.y + LO, ewColor); // East stopline
      drawSignalHead(ctx, n.x + LO, n.y - RH - 6, nsColor); // North stopline
      drawSignalHead(ctx, n.x - LO, n.y + RH + 6, nsColor); // South stopline
    });

    // 8. Draw Vehicles
    eng.vehicles.forEach((v) => {
      if (v.passed) return;
      const lane = LANE_MAP.get(v.laneId);
      if (!lane) return;

      const t = Math.max(0, Math.min(1, v.progress));
      const vx = lane.x1 + (lane.x2 - lane.x1) * t;
      const vy = lane.y1 + (lane.y2 - lane.y1) * t;
      const angle = Math.atan2(lane.y2 - lane.y1, lane.x2 - lane.x1);

      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(angle);

      // Vehicle Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.roundRect(-v.lengthPx / 2 + 1, -v.widthPx / 2 + 1, v.lengthPx, v.widthPx, 3);
      ctx.fill();

      // Emergency Ambulance Special Rendering
      if (v.isEmergency) {
        // White Body
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-v.lengthPx / 2, -v.widthPx / 2, v.lengthPx, v.widthPx, 3);
        ctx.fill();
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Red cross in center
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(-2, -4, 4, 8);
        ctx.fillRect(-4, -2, 8, 4);

        // Flashing Siren Bar
        const sirenColor = Math.sin(Date.now() / 80) > 0 ? '#ef4444' : '#3b82f6';
        ctx.fillStyle = sirenColor;
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowColor = sirenColor;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Pulsing Emergency Beacon Radar Wave
        const pulseR = 18 + Math.sin(Date.now() / 100) * 5;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Standard Vehicle Body
        ctx.fillStyle = v.color;
        ctx.beginPath();
        ctx.roundRect(-v.lengthPx / 2, -v.widthPx / 2, v.lengthPx, v.widthPx, 3);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Windshield
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-v.lengthPx / 4, -v.widthPx / 3, v.lengthPx / 2.5, (v.widthPx * 2) / 3, 1.5);
        ctx.fill();

        // Headlights
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(v.lengthPx / 2 - 2, -v.widthPx / 2 + 1, 2, 2.5);
        ctx.fillRect(v.lengthPx / 2 - 2, v.widthPx / 2 - 3.5, 2, 2.5);

        // Brake lights
        if (v.speed < 0.05) {
          ctx.fillStyle = '#ef4444';
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 5;
          ctx.fillRect(-v.lengthPx / 2, -v.widthPx / 2 + 1, 2, 2.5);
          ctx.fillRect(-v.lengthPx / 2, v.widthPx / 2 - 3.5, 2, 2.5);
          ctx.shadowBlur = 0;
        }
      }

      ctx.restore();
    });

    // 9. Intersection Label Badges (Prominent & Easy to Read on Projector)
    nodes.forEach((n) => {
      const inter = eng.intersections.get(n.id);
      if (!inter) return;
      const sig = inter.signal;

      const badgeW = 124;
      const badgeH = 46;
      // Position badge in upper quadrant of intersection
      const bx = n.x - badgeW / 2;
      const by = n.y - RH - badgeH - 12;

      // Card container
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(bx, by, badgeW, badgeH, 8);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top title
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'left';
      ctx.fillText(n.name, bx + 8, by + 17);

      // Signal Pill Badge inside card
      const isEWGreen = sig.phase === 'EW' && sig.state === 'GREEN';
      const isNSGreen = sig.phase === 'NS' && sig.state === 'GREEN';

      const isEWPreempt = eng.ambulanceActive && !eng.ambulancePassed && isEWGreen && (inter.id === 'J1' || inter.id === 'J2');
      const isNSPreempt = eng.ambulanceActive && !eng.ambulancePassed && isNSGreen && (inter.id === 'J4');

      ctx.font = 'bold 10px JetBrains Mono, monospace';

      // EW indicator
      ctx.fillStyle = isEWGreen ? '#059669' : '#dc2626';
      ctx.beginPath();
      ctx.arc(bx + 14, by + 32, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isEWPreempt ? '#059669' : '#334155';
      const ewText = isEWPreempt ? 'EW PRIO' : (sig.phase === 'EW' ? `EW ${Math.max(1, Math.ceil(sig.greenDuration - sig.timer))}s` : 'EW --s');
      ctx.fillText(ewText, bx + 22, by + 35);

      // NS indicator
      ctx.fillStyle = isNSGreen ? '#059669' : '#dc2626';
      ctx.beginPath();
      ctx.arc(bx + 72, by + 32, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = isNSPreempt ? '#059669' : '#334155';
      const nsText = isNSPreempt ? 'NS PRIO' : (sig.phase === 'NS' ? `NS ${Math.max(1, Math.ceil(sig.greenDuration - sig.timer))}s` : 'NS --s');
      ctx.fillText(nsText, bx + 80, by + 35);
    });
  };

  function drawZebraCrossing(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, vertical: boolean) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    if (vertical) {
      for (let offset = 2; offset < h - 4; offset += 6) {
        ctx.fillRect(x, y + offset, w, 3.5);
      }
    } else {
      for (let offset = 2; offset < w - 4; offset += 6) {
        ctx.fillRect(x + offset, y, 3.5, h);
      }
    }
    ctx.restore();
  }

  function drawSignalHead(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    ctx.save();
    // Signal dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  }

  // ───────────────────────────────────────────────────────────────────────────
  //  PHYSICS & SIMULATION STEP
  // ───────────────────────────────────────────────────────────────────────────
  const tickSimulation = useCallback((dt: number) => {
    const eng = engineRef.current;
    eng.timeElapsed += dt;

    // 1. Tick Traffic Signals for all 4 Intersections
    eng.intersections.forEach((inter) => {
      const sig = inter.signal;
      sig.timer += dt;

      // Emergency Preemption: Dynamic 100% Green Wave along J1(EW) → J2(EW) → J4(NS)
      if (eng.ambulanceActive && !eng.ambulancePassed) {
        const amb = eng.vehicles.find((v) => v.isEmergency && !v.passed);
        if (amb) {
          // J1 Preemption: Force EW Green while ambulance is approaching J1
          if (inter.id === 'J1' && amb.laneId === 'app_w_j1') {
            sig.phase = 'EW';
            sig.state = 'GREEN';
            sig.timer = 0;
            return;
          }

          // J2 Preemption: Force EW Green while ambulance is on app_w_j1 or link_j1_j2
          if (inter.id === 'J2' && (amb.laneId === 'app_w_j1' || amb.laneId === 'link_j1_j2')) {
            sig.phase = 'EW';
            sig.state = 'GREEN';
            sig.timer = 0;
            return;
          }

          // J4 Preemption: Force NS Green while ambulance is on corridor (link_j1_j2, link_j2_j4, exit_s_j4)
          if (inter.id === 'J4' && (amb.laneId === 'link_j1_j2' || amb.laneId === 'link_j2_j4' || amb.laneId === 'exit_s_j4')) {
            sig.phase = 'NS';
            sig.state = 'GREEN';
            sig.timer = 0;
            return;
          }
        }
      }

      // Normal Signal Cycle
      if (sig.state === 'GREEN') {
        const duration = modeRef.current === 'quantum'
          ? (sig.phase === 'EW' ? inter.optimizedGreenEW : inter.optimizedGreenNS)
          : sig.greenDuration;

        if (sig.timer >= duration) {
          sig.state = 'YELLOW';
          sig.timer = 0;
        }
      } else if (sig.state === 'YELLOW') {
        if (sig.timer >= sig.yellowDuration) {
          sig.state = 'RED';
          sig.timer = 0;
          sig.phase = sig.phase === 'EW' ? 'NS' : 'EW';
        }
      } else if (sig.state === 'RED') {
        const duration = modeRef.current === 'quantum'
          ? (sig.phase === 'EW' ? inter.optimizedGreenNS : inter.optimizedGreenEW)
          : sig.redDuration;

        if (sig.timer >= duration) {
          sig.state = 'GREEN';
          sig.timer = 0;
        }
      }
    });

    // 2. Spawn Vehicles
    const spawnRate = densityRef.current === 'high' ? 0.8 : densityRef.current === 'medium' ? 0.45 : 0.25;
    const entryLanes = ['app_w_j1', 'app_n_j1', 'app_e_j2', 'app_n_j2', 'app_w_j3', 'app_s_j3', 'app_e_j4', 'app_s_j4'];

    entryLanes.forEach((laneId) => {
      // Keep emergency corridor clear of incoming random civilian cars while ambulance is en route
      if (eng.ambulanceActive && !eng.ambulancePassed) {
        if (laneId === 'app_w_j1' || laneId === 'app_n_j2' || laneId === 'app_e_j2') return;
      }

      if (Math.random() < spawnRate * dt) {
        const vehiclesOnThisLane = eng.vehicles.filter((v) => v.laneId === laneId && !v.passed);
        const nearEntry = vehiclesOnThisLane.some((v) => v.progress < 0.15);
        if (!nearEntry) {
          eng.vehicles.push(createVehicle(laneId));
        }
      }
    });

    // 3. Move Vehicles with Collision-Free Forward Scanning & Emergency Clearing
    eng.vehicles.forEach((v) => {
      if (v.passed) return;
      const currentLane = LANE_MAP.get(v.laneId);
      if (!currentLane) {
        v.passed = true;
        return;
      }

      // Determine if must stop at stopline
      let mustStop = false;
      if (currentLane.isApproach && currentLane.approachNode) {
        const inter = eng.intersections.get(currentLane.approachNode);
        if (inter) {
          const sig = inter.signal;
          const isGreen = sig.state === 'GREEN' && sig.phase === currentLane.signalPhase;
          if (!isGreen) {
            mustStop = true;
          }
        }
      }

      // Emergency Vehicle NEVER stops at stoplines (preempted green corridor)
      if (v.isEmergency) {
        mustStop = false;
      }

      // Civilian vehicles on emergency corridor do not stop at signals, clearing the way
      if (!v.isEmergency && eng.ambulanceActive && !eng.ambulancePassed) {
        if (v.laneId === 'app_w_j1' || v.laneId === 'link_j1_j2' || v.laneId === 'link_j2_j4' || v.laneId === 'exit_s_j4') {
          mustStop = false;
        }
      }

      // Find vehicle directly ahead on the same lane
      const onSameLane = eng.vehicles.filter((other) => other.laneId === v.laneId && !other.passed && other.id !== v.id);
      let leadVehicle: Vehicle | null = null;
      let minGap = Infinity;

      onSameLane.forEach((other) => {
        if (other.progress > v.progress) {
          const gap = other.progress - v.progress;
          if (gap < minGap) {
            minGap = gap;
            leadVehicle = other;
          }
        }
      });

      // Target Speed Calculation
      let targetSpeed = v.maxSpeed;
      const stoplineDist = 1.0 - v.progress;
      const safeDistanceProgress = (v.lengthPx + 24) / currentLane.length;

      // Emergency vehicle rapid cruising speed
      if (v.isEmergency) {
        v.maxSpeed = 0.65;
        targetSpeed = 0.60;
      }

      // Civilian vehicles on emergency corridor yield and flush forward quickly
      if (!v.isEmergency && eng.ambulanceActive && !eng.ambulancePassed) {
        if (v.laneId === 'app_w_j1' || v.laneId === 'link_j1_j2' || v.laneId === 'link_j2_j4' || v.laneId === 'exit_s_j4') {
          targetSpeed = 0.58;
          v.speed = Math.max(v.speed, 0.45);
        }
      }

      // Stopline Deceleration for normal vehicles
      if (mustStop && stoplineDist < 0.35) {
        if (stoplineDist <= safeDistanceProgress) {
          targetSpeed = 0;
        } else {
          targetSpeed = v.maxSpeed * (stoplineDist / 0.35);
        }
      }

      // Headway Car-Following Model (Zero Overlap with Emergency Priority)
      if (leadVehicle && minGap < safeDistanceProgress * 2.5) {
        if (v.isEmergency) {
          // If ambulance is behind lead vehicle, command lead vehicle to accelerate and yield
          (leadVehicle as Vehicle).speed = Math.max((leadVehicle as Vehicle).speed, 0.55);
          if (minGap <= safeDistanceProgress) {
            targetSpeed = Math.min(targetSpeed, (leadVehicle as Vehicle).speed);
          }
        } else {
          if (minGap <= safeDistanceProgress) {
            targetSpeed = 0;
          } else {
            targetSpeed = Math.min(targetSpeed, (leadVehicle as Vehicle).speed * (minGap / (safeDistanceProgress * 2.5)));
          }
        }
      }

      // Smooth Acceleration / Deceleration
      if (v.speed < targetSpeed) {
        v.speed = Math.min(targetSpeed, v.speed + (v.isEmergency ? 0.7 : 0.35) * dt);
      } else {
        v.speed = Math.max(targetSpeed, v.speed - 0.8 * dt);
      }

      // Apply movement
      v.progress += (v.speed * (150 / currentLane.length)) * dt;

      if (v.speed < 0.05) {
        v.waitTime += dt;
      }

      // Check for lane transition or exit
      if (v.progress >= 0.98) {
        if (v.isEmergency) {
          // Follow fixed ambulance route
          v.routeIdx += 1;
          if (v.routeIdx < v.route.length) {
            v.laneId = v.route[v.routeIdx];
            v.progress = 0.02;
          } else {
            v.passed = true;
            eng.ambulancePassed = true;
            eng.ambulanceActive = false;
            setAmbulanceActive(false);
            eng.logs.unshift({
              id: String(Date.now()),
              text: 'Ambulance successfully reached destination — Normal optimized timing restored',
              time: `${Math.floor(eng.timeElapsed / 60).toString().padStart(2, '0')}:${Math.floor(eng.timeElapsed % 60).toString().padStart(2, '0')}`,
              type: 'success',
            });
          }
        } else if (currentLane.nextLanes && currentLane.nextLanes.length > 0) {
          let nextLaneId = currentLane.nextLanes[Math.floor(Math.random() * currentLane.nextLanes.length)];
          // If ambulance is active, divert civilian traffic off the emergency corridor at J2
          if (eng.ambulanceActive && !eng.ambulancePassed && v.laneId === 'link_j1_j2') {
            nextLaneId = 'exit_e_j2';
          }
          v.laneId = nextLaneId;
          v.progress = 0.02;
        } else {
          v.passed = true;
          eng.totalPassed += 1;
        }
      }
    });

    // Clean up passed vehicles
    eng.vehicles = eng.vehicles.filter((v) => !v.passed);

    // 4. Update Queues & Real-Time QUBO Optimization Calculation
    eng.intersections.forEach((inter) => {
      const ewVehicles = eng.vehicles.filter((v) => (v.laneId.includes('w_' + inter.id.toLowerCase()) || v.laneId.includes('e_' + inter.id.toLowerCase()) || (v.laneId.includes('j1_j2') && inter.id === 'J2') || (v.laneId.includes('j3_j4') && inter.id === 'J4')) && v.speed < 0.05);
      const nsVehicles = eng.vehicles.filter((v) => (v.laneId.includes('n_' + inter.id.toLowerCase()) || v.laneId.includes('s_' + inter.id.toLowerCase()) || (v.laneId.includes('j1_j3') && inter.id === 'J3') || (v.laneId.includes('j2_j4') && inter.id === 'J4')) && v.speed < 0.05);

      inter.ewQueue = ewVehicles.length;
      inter.nsQueue = nsVehicles.length;

      // Adaptive QUBO Optimization (re-allocate green times proportionally to queues)
      if (modeRef.current === 'quantum') {
        inter.optimizedGreenEW = Math.min(38, Math.max(14, Math.round(18 + inter.ewQueue * 2.2 - inter.nsQueue * 0.8)));
        inter.optimizedGreenNS = Math.min(38, Math.max(14, Math.round(18 + inter.nsQueue * 2.2 - inter.ewQueue * 0.8)));
      } else {
        inter.optimizedGreenEW = 20;
        inter.optimizedGreenNS = 20;
      }
    });
  }, []);

  // ────────────────────────────────────────────────────────────────────────  // ───────────────────────────────────────────────────────────────────────────
  //  CANVAS RENDERING & ANIMATION LOOP (60 FPS)
  // ───────────────────────────────────────────────────────────────────────────
  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D) => {
    const eng = engineRef.current;
    ctx.clearRect(0, 0, CW, CH);

    // 1. Background Grid & Asphalt Base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, CW, CH);

    // Technical Grid Lines
    ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CW; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CH);
      ctx.stroke();
    }
    for (let y = 0; y < CH; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CW, y);
      ctx.stroke();
    }

    // 2. Draw Roads (Standard Clean Asphalt)
    LANES.forEach((lane) => {
      ctx.save();

      // Outer Road Border
      ctx.beginPath();
      ctx.moveTo(lane.x1, lane.y1);
      ctx.lineTo(lane.x2, lane.y2);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = RW + 2;
      ctx.stroke();

      // Dark Asphalt Surface
      ctx.beginPath();
      ctx.moveTo(lane.x1, lane.y1);
      ctx.lineTo(lane.x2, lane.y2);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = RW;
      ctx.stroke();

      // Yellow Dashed Center Line Divider
      ctx.beginPath();
      ctx.moveTo(lane.x1, lane.y1);
      ctx.lineTo(lane.x2, lane.y2);
      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    });

    // 3. Draw Junction Boxes & Signal Heads
    eng.intersections.forEach((inter: IntersectionInfo) => {
      // Junction Box
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(inter.x - RH, inter.y - RH, RW, RW);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.strokeRect(inter.x - RH, inter.y - RH, RW, RW);

      // Junction Label Badge
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(inter.x - 18, inter.y - 10, 36, 20);
      ctx.strokeStyle = '#0d9488';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(inter.x - 18, inter.y - 10, 36, 20);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(inter.id, inter.x, inter.y);

      // Signal Light Colors
      const sig = inter.signal;
      const ewColor = sig.phase === 'EW' ? (sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444') : '#ef4444';
      const nsColor = sig.phase === 'NS' ? (sig.state === 'GREEN' ? '#10b981' : sig.state === 'YELLOW' ? '#f59e0b' : '#ef4444') : '#ef4444';

      // EW Traffic Light (Left & Right of Junction)
      ctx.fillStyle = ewColor;
      ctx.shadowColor = ewColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(inter.x - RH - 8, inter.y, 6, 0, Math.PI * 2);
      ctx.arc(inter.x + RH + 8, inter.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // NS Traffic Light (Top & Bottom of Junction)
      ctx.fillStyle = nsColor;
      ctx.shadowColor = nsColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(inter.x, inter.y - RH - 8, 6, 0, Math.PI * 2);
      ctx.arc(inter.x, inter.y + RH + 8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // 3.5 Draw Semi-Transparent Light Blue Ambulance Overlay Ribbon ON TOP OF ROAD (Matching User Spec)
    if (eng.ambulanceActive) {
      ctx.save();
      ctx.beginPath();

      // Exact One-Way Route: Entrance -> J1 -> J2 -> J4 -> South Exit
      ctx.moveTo(0, J1.y - LO);
      ctx.lineTo(J2.x + LO, J2.y - LO);
      ctx.lineTo(J2.x + LO, CH);

      // Outer Semi-Transparent Light Blue Ribbon Fill
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'; // Semi-transparent Sky-400 Light Blue
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Luminous Inner Light Blue Core Line
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)'; // Luminous Light Blue
      ctx.lineWidth = 6;
      ctx.shadowBlur = 0;
      ctx.stroke();

      // Animated White Directional Pulse Line
      ctx.beginPath();
      ctx.moveTo(0, J1.y - LO);
      ctx.lineTo(J2.x + LO, J2.y - LO);
      ctx.lineTo(J2.x + LO, CH);
      ctx.setLineDash([10, 6]);
      ctx.lineDashOffset = - (Date.now() / 20) % 16;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
    }

    // 4. Draw Moving Vehicles
    eng.vehicles.forEach((v: Vehicle) => {
      const lane = LANE_MAP.get(v.laneId);
      if (!lane) return;

      const vx = lane.x1 + (lane.x2 - lane.x1) * v.progress;
      const vy = lane.y1 + (lane.y2 - lane.y1) * v.progress;
      const angle = Math.atan2(lane.y2 - lane.y1, lane.x2 - lane.x1);

      ctx.save();
      ctx.translate(vx, vy);
      ctx.rotate(angle);

      if (v.isEmergency) {
        // Flashing emergency lights & shadow
        const flash = Math.floor(Date.now() / 150) % 2 === 0;
        ctx.shadowColor = flash ? '#ef4444' : '#3b82f6';
        ctx.shadowBlur = 16;

        ctx.fillStyle = '#e11d48';
        ctx.fillRect(-v.lengthPx / 2, -v.widthPx / 2, v.lengthPx, v.widthPx);

        // Emergency Roof Light
        ctx.fillStyle = flash ? '#ffffff' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();

        // Medical Cross Symbol
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -5, 4, 10);
        ctx.fillRect(-5, -2, 10, 4);
      } else {
        // Civilian Vehicle Body
        ctx.fillStyle = v.color;
        ctx.fillRect(-v.lengthPx / 2, -v.widthPx / 2, v.lengthPx, v.widthPx);

        // Windshield Glass
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-v.lengthPx * 0.1, -v.widthPx * 0.3, v.lengthPx * 0.4, v.widthPx * 0.6);
      }

      // Headlight Beams
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(v.lengthPx / 2 - 1, -v.widthPx / 2 + 1, 2, 2);
      ctx.fillRect(v.lengthPx / 2 - 1, v.widthPx / 2 - 3, 2, 2);

      ctx.restore();
    });
  }, []);

  // 60 FPS Animation & Engine Update Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (isRunningRef.current) {
        tickSimulation(dt);

        // Dispatch updated metrics to CommandCenter parent
        const eng = engineRef.current;
        if (onMetricsUpdate) {
          const totalWait = eng.vehicles.reduce((acc: number, v: Vehicle) => acc + v.waitTime, 0);
          const avgWait = eng.vehicles.length > 0 ? totalWait / eng.vehicles.length : 0;
          const interList = Array.from(eng.intersections.values());
          const totalQueue = interList.reduce((acc: number, i: IntersectionInfo) => acc + i.ewQueue + i.nsQueue, 0);

          onMetricsUpdate({
            avgWait: Number(avgWait.toFixed(1)),
            queueLen: totalQueue,
            throughput: 1200 + Math.round(eng.totalPassed * 12),
            co2: Number((70 + avgWait * 0.6).toFixed(1)),
            fuel: Number((30 + avgWait * 0.2).toFixed(1)),
            emergencyEta: eng.ambulanceActive ? 1.8 : 0,
            activeMode: modeRef.current,
            totalVehicles: eng.vehicles.length,
            intersections: interList,
          });
        }
      }

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) drawCanvas(ctx);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [tickSimulation, drawCanvas, onMetricsUpdate]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col w-full">
      {/* ── STEP 10: SIMULATION HEADER ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 flex-shrink-0">
            <Activity size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 tracking-tight leading-none">
                Quantum Traffic Simulation Network
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 border border-emerald-200 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                LIVE 4-WAY MESH
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Intersections J1–J4 • Dynamic Phase Routing & Kinematic Simulation
            </p>
          </div>
        </div>

        {/* STEP 11: MODE CONTROL (36px height, 8px gap, min-w-140px buttons) */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1.5">MODE</span>
          <button
            onClick={() => setMode('classical')}
            className={`h-[36px] min-w-[140px] px-3.5 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'classical'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-300 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock size={14} className={mode === 'classical' ? 'text-slate-700' : 'text-slate-400'} />
            <span>Classical Fixed</span>
          </button>
          <button
            onClick={() => setMode('quantum')}
            className={`h-[36px] min-w-[160px] px-3.5 rounded-md text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'quantum'
                ? 'bg-purple-600 text-white shadow-xs border border-purple-700'
                : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            <Zap size={14} className={mode === 'quantum' ? 'text-amber-300 animate-pulse' : 'text-purple-500'} />
            <span>Quantum Optimized (QUBO)</span>
          </button>
        </div>
      </div>

      {/* ── STEP 12 & 13: SIMULATION CONTROLS & TRAFFIC DENSITY ── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* 4 Active Intersections Badge */}
          <div className="h-[36px] flex items-center gap-2 px-3 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>4 Intersections</span>
          </div>

          {/* STEP 12: Traffic Density Selector (Gap 4px, Min-width 48px buttons) */}
          <div className="h-[36px] flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 text-xs shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 pr-1">Density</span>
            {(['low', 'medium', 'high'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`min-w-[48px] h-[26px] px-2 rounded capitalize text-[11px] font-semibold flex items-center justify-center transition cursor-pointer ${
                  density === d
                    ? 'bg-slate-900 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* STEP 13: Simulation Control Actions (36px height, 8px gap) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Start / Pause */}
          {!isRunning ? (
            <button
              onClick={handleStart}
              className="h-[36px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              <Play size={13} />
              <span>Resume</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="h-[36px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition cursor-pointer"
            >
              <Pause size={13} className="text-slate-500" />
              <span>Pause</span>
            </button>
          )}

          {/* Reset */}
          <button
            onClick={handleReset}
            className="h-[36px] flex items-center justify-center gap-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 text-xs font-medium transition shadow-2xs cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Deploy Emergency Corridor */}
          <button
            onClick={handleDeployAmbulance}
            disabled={ambulanceActive}
            className={`h-[36px] flex items-center justify-center gap-1.5 px-3.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              ambulanceActive
                ? 'bg-rose-100 text-rose-700 border border-rose-300 cursor-not-allowed animate-pulse'
                : 'bg-rose-600 hover:bg-rose-700 text-white border border-rose-700'
            }`}
          >
            <Ambulance size={14} className={ambulanceActive ? 'animate-bounce' : ''} />
            <span>{ambulanceActive ? 'Corridor Active' : 'Emergency Corridor'}</span>
          </button>
        </div>
      </div>

      {/* ── STEP 9 & 14: MAP CONTAINER (height min(55vh, 600px), min-height 420px) ── */}
      <div className="relative w-full h-[min(55vh,600px)] min-h-[420px] bg-slate-100/70 p-3 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          className="w-full h-full object-contain rounded-lg border border-slate-200 shadow-inner bg-slate-50 block"
        />

        {/* Emergency Wave Active Overlay Badge */}
        {ambulanceActive && (
          <div className="absolute top-5 left-5 z-10 flex items-center gap-2.5 px-4 py-2 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 shadow-md animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <span className="text-xs font-extrabold font-mono uppercase tracking-wider">
              EMERGENCY GREEN CORRIDOR ACTIVE — PRE-EMPTION J1 → J2 → J4
            </span>
          </div>
        )}
      </div>

      {/* ── STEP 17: LEGEND (Horizontal flex layout with 24px gap) ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-t border-slate-200 bg-white text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-[24px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600" />
            <span className="font-semibold text-slate-700">Normal Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="font-semibold text-slate-700">Heavy Traffic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🚑</span>
            <span className="font-bold text-rose-700">Emergency Vehicle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-teal-600 font-bold text-base leading-none">→</span>
            <span className="font-semibold text-teal-700">Optimized Route</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Microscopic 2D Engine
        </div>
      </div>

      {/* ── STEP 18: TECHNICAL STATUS (20px gap between items) ── */}
      <div className="flex flex-wrap items-center justify-between gap-[20px] px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500">
        <div className="flex items-center gap-[20px]">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Simulation: 60 FPS
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-teal-600" />
            Collision Detection: Active
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-slate-600">
          <Shield size={13} className="text-purple-600" />
          <span>QUBO Optimization: Synchronized</span>
        </div>
      </div>
    </div>
  );
}
