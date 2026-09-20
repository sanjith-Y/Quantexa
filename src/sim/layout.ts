// sim/layout.ts
// Fixed road network geometry for J1 (4-way) and J2 (3-way T-junction)
// Canvas is 900 x 560. Roads are 52px wide (26px each lane).

export const CANVAS_W = 900;
export const CANVAS_H = 560;

export const ROAD_HALF = 26;   // half road width = one lane = 26px
export const ROAD_W = 52;      // full road width

// ── Intersection centres ──────────────────────────────────────────────────────
export const J1 = { cx: 270, cy: 280 } as const;
export const J2 = { cx: 650, cy: 280 } as const;

// ── Key x/y boundaries ───────────────────────────────────────────────────────
// J1 box
export const J1_L = J1.cx - ROAD_HALF;
export const J1_R = J1.cx + ROAD_HALF;
export const J1_T = J1.cy - ROAD_HALF;
export const J1_B = J1.cy + ROAD_HALF;

// J2 box (T-junction: W, N, E — no south road)
export const J2_L = J2.cx - ROAD_HALF;
export const J2_R = J2.cx + ROAD_HALF;
export const J2_T = J2.cy - ROAD_HALF;
export const J2_B = J2.cy + ROAD_HALF;

// Connecting road between J1 and J2 (EW road at cy=280)
export const LINK_T = 280 - ROAD_HALF;
export const LINK_B = 280 + ROAD_HALF;

// ── Stopline distances ────────────────────────────────────────────────────────
// A vehicle stops ROAD_HALF pixels before the intersection centre (i.e. at the kerb)
export const STOP_MARGIN = ROAD_HALF + 4; // a bit before the box

// ── Lane polyline definitions ─────────────────────────────────────────────────
// Lane id convention: <from>2<to>_<laneIndex>
// Approach lanes run TO the intersection stopline.
// Exit lanes run FROM the intersection.
// Link lanes run between J1 exit and J2 approach etc.

// Offset helpers: rightmost lane of a pair
//  Eastbound → lower y (J1.cy - 13)
//  Westbound → upper y (J1.cy + 13)
//  Southbound → right x (J1.cx + 13)
//  Northbound → left x  (J1.cx - 13)
const LANE_OFFSET = 13;

// ──────────────── J1 APPROACHES ──────────────────────────────────────────────
// West → East (approach from left edge)
export const J1_W_APPROACH: [number,number][] = [
  [0, J1.cy - LANE_OFFSET],
  [J1_L, J1.cy - LANE_OFFSET],
];
// East → West (approach from right, actually from link road)
export const J1_E_APPROACH: [number,number][] = [
  [J1_R, J1.cy + LANE_OFFSET],
  [0, J1.cy + LANE_OFFSET],  // exits left edge
];
// North → South
export const J1_N_APPROACH: [number,number][] = [
  [J1.cx + LANE_OFFSET, 0],
  [J1.cx + LANE_OFFSET, J1_T],
];
// South → North
export const J1_S_APPROACH: [number,number][] = [
  [J1.cx - LANE_OFFSET, CANVAS_H],
  [J1.cx - LANE_OFFSET, J1_B],
];

// ──────────────── J1 EXITS ───────────────────────────────────────────────────
// Goes east (toward J2)
export const J1_EXIT_E: [number,number][] = [
  [J1_R, J1.cy - LANE_OFFSET],
  [J2_L, J1.cy - LANE_OFFSET],
];
// Goes west (off screen left)
export const J1_EXIT_W: [number,number][] = [
  [J1_L, J1.cy + LANE_OFFSET],
  [0, J1.cy + LANE_OFFSET],
];
// Goes south (off screen bottom)
export const J1_EXIT_S: [number,number][] = [
  [J1.cx + LANE_OFFSET, J1_B],
  [J1.cx + LANE_OFFSET, CANVAS_H],
];
// Goes north (off screen top)
export const J1_EXIT_N: [number,number][] = [
  [J1.cx - LANE_OFFSET, J1_T],
  [J1.cx - LANE_OFFSET, 0],
];

// ──────────────── J2 APPROACHES ──────────────────────────────────────────────
// West → East (from J1 east exit to J2)
export const J2_W_APPROACH: [number,number][] = [
  [J1_R, J1.cy - LANE_OFFSET],
  [J2_L, J2.cy - LANE_OFFSET],
];
// East → West (approach from right edge)
export const J2_E_APPROACH: [number,number][] = [
  [CANVAS_W, J2.cy + LANE_OFFSET],
  [J2_R, J2.cy + LANE_OFFSET],
];
// North → South (T-junction, no south road at J2)
export const J2_N_APPROACH: [number,number][] = [
  [J2.cx + LANE_OFFSET, 0],
  [J2.cx + LANE_OFFSET, J2_T],
];

// ──────────────── J2 EXITS ───────────────────────────────────────────────────
// Goes east (off screen right)
export const J2_EXIT_E: [number,number][] = [
  [J2_R, J2.cy - LANE_OFFSET],
  [CANVAS_W, J2.cy - LANE_OFFSET],
];
// Goes west (toward J1)
export const J2_EXIT_W: [number,number][] = [
  [J2_L, J2.cy + LANE_OFFSET],
  [J1_R, J1.cy + LANE_OFFSET],  // feeds J1 east approach exit lane
];
// Goes north (off screen top) — exit after N approach straight-through
export const J2_EXIT_N: [number,number][] = [
  [J2.cx - LANE_OFFSET, J2_T],
  [J2.cx - LANE_OFFSET, 0],
];

// ── Lane registry ─────────────────────────────────────────────────────────────
export interface LaneDef {
  id: string;
  points: [number,number][];
  intersectionId: string | null;
  type: 'approach' | 'exit' | 'link';
  signalPhase: string | null;   // which signal phase controls this approach
  nextLanes: string[];          // possible next lanes (exits)
  stopLineT: number;            // 0..1 progress where stopline is (1.0 for exit/link)
  capacity: number;
}

// Progress helper: distance between two points
function dist(a: [number,number], b: [number,number]) {
  return Math.hypot(b[0]-a[0], b[1]-a[1]);
}
function polyLen(pts: [number,number][]) {
  let d = 0;
  for (let i=1;i<pts.length;i++) d += dist(pts[i-1], pts[i]);
  return d;
}

// For approach lanes, stopline is at the END (progress=1.0 is at intersection edge)
// The vehicle stops just before reaching progress=1.0.

export const LANE_DEFS: LaneDef[] = [
  // J1 approaches
  {
    id:'J1_W_app', points:J1_W_APPROACH, intersectionId:'J1',
    type:'approach', signalPhase:'EW', nextLanes:['J1_exit_E','J1_exit_W','J1_exit_S','J1_exit_N'],
    stopLineT:1.0, capacity:12,
  },
  {
    id:'J1_E_app', points:[[J1_R, J1.cy+LANE_OFFSET],[0, J1.cy+LANE_OFFSET]], intersectionId:'J1',
    type:'approach', signalPhase:'EW', nextLanes:['J1_exit_W'],
    stopLineT:0.0, capacity:12,
    // East→West approach: vehicle comes from J2 side.
    // Points go RIGHT→LEFT. Vehicle spawns at progress=0 (right side) and moves toward progress=1.
    // Redefine for clarity:
  },
  {
    id:'J1_N_app', points:J1_N_APPROACH, intersectionId:'J1',
    type:'approach', signalPhase:'NS', nextLanes:['J1_exit_S','J1_exit_E','J1_exit_W'],
    stopLineT:1.0, capacity:10,
  },
  {
    id:'J1_S_app', points:J1_S_APPROACH, intersectionId:'J1',
    type:'approach', signalPhase:'NS', nextLanes:['J1_exit_N','J1_exit_E','J1_exit_W'],
    stopLineT:1.0, capacity:10,
  },
  // J1 exits
  { id:'J1_exit_E', points:J1_EXIT_E, intersectionId:null, type:'exit', signalPhase:null, nextLanes:['J2_W_app'], stopLineT:1.0, capacity:20 },
  { id:'J1_exit_W', points:J1_EXIT_W, intersectionId:null, type:'exit', signalPhase:null, nextLanes:[], stopLineT:1.0, capacity:20 },
  { id:'J1_exit_S', points:J1_EXIT_S, intersectionId:null, type:'exit', signalPhase:null, nextLanes:[], stopLineT:1.0, capacity:10 },
  { id:'J1_exit_N', points:J1_EXIT_N, intersectionId:null, type:'exit', signalPhase:null, nextLanes:[], stopLineT:1.0, capacity:10 },
  // J2 approaches
  {
    id:'J2_W_app', points:J2_W_APPROACH, intersectionId:'J2',
    type:'approach', signalPhase:'EW', nextLanes:['J2_exit_E','J2_exit_N'],
    stopLineT:1.0, capacity:16,
  },
  {
    id:'J2_E_app', points:J2_E_APPROACH, intersectionId:'J2',
    type:'approach', signalPhase:'EW', nextLanes:['J2_exit_W','J2_exit_N'],
    stopLineT:1.0, capacity:16,
  },
  {
    id:'J2_N_app', points:J2_N_APPROACH, intersectionId:'J2',
    type:'approach', signalPhase:'N', nextLanes:['J2_exit_E','J2_exit_W'],
    stopLineT:1.0, capacity:10,
  },
  // J2 exits
  { id:'J2_exit_E', points:J2_EXIT_E, intersectionId:null, type:'exit', signalPhase:null, nextLanes:[], stopLineT:1.0, capacity:20 },
  { id:'J2_exit_W', points:J2_EXIT_W, intersectionId:null, type:'exit', signalPhase:null, nextLanes:['J1_E_app'], stopLineT:1.0, capacity:20 },
  { id:'J2_exit_N', points:J2_EXIT_N, intersectionId:null, type:'exit', signalPhase:null, nextLanes:[], stopLineT:1.0, capacity:10 },
  // J1 East approach (W→ from J2 side, vehicles heading west through J1)
  {
    id:'J1_E_app', points:[[J1_R, J1.cy+LANE_OFFSET],[0, J1.cy+LANE_OFFSET]], intersectionId:'J1',
    type:'approach', signalPhase:'EW', nextLanes:['J1_exit_W'],
    stopLineT:0.0, capacity:12,
  },
];

// De-duplicate lane defs (J1_E_app defined twice above — keep last)
const seen = new Set<string>();
export const LANES: LaneDef[] = [];
for (const l of [...LANE_DEFS].reverse()) {
  if (!seen.has(l.id)) { seen.add(l.id); LANES.unshift(l); }
}

export function getLaneDef(id: string): LaneDef | undefined {
  return LANES.find(l => l.id === id);
}

// Compute total length of a lane
export function laneLength(id: string): number {
  const l = getLaneDef(id);
  if (!l) return 1;
  return Math.max(1, polyLen(l.points));
}

// Interpolate position along lane at progress t (0..1)
export function lanePosition(id: string, t: number): { x: number; y: number; angle: number } {
  const l = getLaneDef(id);
  if (!l || l.points.length < 2) return { x: 0, y: 0, angle: 0 };
  const pts = l.points;
  const total = polyLen(pts);
  const target = t * total;
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = dist(pts[i-1], pts[i]);
    if (acc + seg >= target || i === pts.length - 1) {
      const frac = seg > 0 ? (target - acc) / seg : 0;
      const x = pts[i-1][0] + (pts[i][0] - pts[i-1][0]) * frac;
      const y = pts[i-1][1] + (pts[i][1] - pts[i-1][1]) * frac;
      const angle = Math.atan2(pts[i][1]-pts[i-1][1], pts[i][0]-pts[i-1][0]);
      return { x, y, angle };
    }
    acc += seg;
  }
  const last = pts[pts.length-1];
  const secondLast = pts[pts.length-2];
  return { x: last[0], y: last[1], angle: Math.atan2(last[1]-secondLast[1], last[0]-secondLast[0]) };
}
