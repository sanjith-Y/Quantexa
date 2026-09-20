import { Vehicle, IntersectionSignal } from '../types/sim2';

const CAR_PALETTES = [
  '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399', '#facc15', '#fb923c', '#e2e8f0'
];

let globalVehicleId = 1;

export function createVehicle(lane: Vehicle['lane']): Vehicle {
  let x = 0;
  let y = 0;
  const isTruck = Math.random() < 0.15;
  const isBus = !isTruck && Math.random() < 0.1;
  const type: Vehicle['type'] = isTruck ? 'truck' : isBus ? 'bus' : 'car';
  const color = CAR_PALETTES[Math.floor(Math.random() * CAR_PALETTES.length)];

  // Topology:
  // Intersection 1 Center: (400, 150)
  // Intersection 2 Center: (400, 430)
  // Connecting Link: Vertical from (400, 150) down to (400, 430)
  switch (lane) {
    case 'I1_NORTH': x = 390; y = 10; break;
    case 'I1_WEST':  x = 10;  y = 140; break;
    case 'I1_EAST':  x = 790; y = 160; break;
    case 'LINK_DOWN':x = 390; y = 200; break;
    case 'LINK_UP':  x = 410; y = 370; break;
    case 'I2_SOUTH': x = 410; y = 570; break;
    case 'I2_WEST':  x = 10;  y = 420; break;
    case 'I2_EAST':  x = 790; y = 440; break;
  }

  return {
    id: globalVehicleId++,
    lane,
    x,
    y,
    speed: 0,
    maxSpeed: 2.2 + Math.random() * 1.2,
    stopped: false,
    color,
    type,
    waitingTime: 0,
  };
}

export function updateVehicles(
  vehicles: Vehicle[],
  sig1: IntersectionSignal,
  sig2: IntersectionSignal,
  dt: number
): { updatedVehicles: Vehicle[]; passedCount: number } {
  let passedCount = 0;

  // Stoplines:
  // I1 North: y = 100
  // I1 West:  x = 345
  // I1 East:  x = 455
  // I1 South (into Link): y = 200

  // I2 North (from Link): y = 380
  // I2 South: y = 480
  // I2 West:  x = 345
  // I2 East:  x = 455

  const updatedVehicles: Vehicle[] = [];

  // Group by lane to handle queuing behind cars in front
  const laneGroups: Record<string, Vehicle[]> = {};
  vehicles.forEach(v => {
    if (!laneGroups[v.lane]) laneGroups[v.lane] = [];
    laneGroups[v.lane].push(v);
  });

  Object.entries(laneGroups).forEach(([lane, group]) => {
    // Sort according to travel direction (front cars first)
    if (lane === 'I1_NORTH' || lane === 'LINK_DOWN') {
      group.sort((a, b) => b.y - a.y);
    } else if (lane === 'I2_SOUTH' || lane === 'LINK_UP') {
      group.sort((a, b) => a.y - b.y);
    } else if (lane === 'I1_WEST' || lane === 'I2_WEST') {
      group.sort((a, b) => b.x - a.x);
    } else if (lane === 'I1_EAST' || lane === 'I2_EAST') {
      group.sort((a, b) => a.x - b.x);
    }

    for (let i = 0; i < group.length; i++) {
      const v = group[i];
      let mustStop = false;
      const leadCar = i > 0 ? group[i - 1] : null;

      // 1. Check Traffic Signal Stoplines
      if (lane === 'I1_NORTH') {
        const atStopLine = v.y >= 90 && v.y <= 105;
        if (atStopLine && sig1.nsLight !== 'GREEN') mustStop = true;
      } else if (lane === 'I1_WEST') {
        const atStopLine = v.x >= 335 && v.x <= 350;
        if (atStopLine && sig1.ewLight !== 'GREEN') mustStop = true;
      } else if (lane === 'I1_EAST') {
        const atStopLine = v.x <= 465 && v.x >= 450;
        if (atStopLine && sig1.ewLight !== 'GREEN') mustStop = true;
      } else if (lane === 'LINK_DOWN') {
        // Approaching Intersection 2 from Link
        const atStopLine = v.y >= 370 && v.y <= 385;
        if (atStopLine && sig2.nsLight !== 'GREEN') mustStop = true;
      } else if (lane === 'I2_SOUTH') {
        const atStopLine = v.y <= 490 && v.y >= 475;
        if (atStopLine && sig2.nsLight !== 'GREEN') mustStop = true;
      } else if (lane === 'I2_WEST') {
        const atStopLine = v.x >= 335 && v.x <= 350;
        if (atStopLine && sig2.ewLight !== 'GREEN') mustStop = true;
      } else if (lane === 'I2_EAST') {
        const atStopLine = v.x <= 465 && v.x >= 450;
        if (atStopLine && sig2.ewLight !== 'GREEN') mustStop = true;
      }

      // 2. Check Distance to Lead Car (Queuing)
      const minDistance = 22;
      if (leadCar) {
        if (lane === 'I1_NORTH' || lane === 'LINK_DOWN') {
          if (leadCar.y - v.y < minDistance && leadCar.y > v.y) mustStop = true;
        } else if (lane === 'I2_SOUTH' || lane === 'LINK_UP') {
          if (v.y - leadCar.y < minDistance && leadCar.y < v.y) mustStop = true;
        } else if (lane === 'I1_WEST' || lane === 'I2_WEST') {
          if (leadCar.x - v.x < minDistance && leadCar.x > v.x) mustStop = true;
        } else if (lane === 'I1_EAST' || lane === 'I2_EAST') {
          if (v.x - leadCar.x < minDistance && leadCar.x < v.x) mustStop = true;
        }
      }

      // 3. Accelerate or Decelerate
      let speed = v.speed;
      let waitingTime = v.waitingTime;

      if (mustStop) {
        speed = Math.max(0, speed - 0.4);
        waitingTime += dt;
      } else {
        speed = Math.min(v.maxSpeed, speed + 0.15);
      }

      const stopped = speed < 0.2;

      // 4. Update coordinates
      let x = v.x;
      let y = v.y;
      let currentLane = v.lane;

      if (currentLane === 'I1_NORTH') {
        y += speed;
        // Check if car passes I1 and continues into the connecting link to I2
        if (y > 170 && y < 190 && Math.random() < 0.65) {
          currentLane = 'LINK_DOWN';
        } else if (y > 590) {
          passedCount++;
        }
      } else if (currentLane === 'LINK_DOWN') {
        y += speed;
        if (y > 590) passedCount++;
      } else if (currentLane === 'I2_SOUTH') {
        y -= speed;
        if (y < 410 && y > 390 && Math.random() < 0.65) {
          currentLane = 'LINK_UP';
        } else if (y < 10) {
          passedCount++;
        }
      } else if (currentLane === 'LINK_UP') {
        y -= speed;
        if (y < 10) passedCount++;
      } else if (currentLane === 'I1_WEST' || currentLane === 'I2_WEST') {
        x += speed;
        if (x > 790) passedCount++;
      } else if (currentLane === 'I1_EAST' || currentLane === 'I2_EAST') {
        x -= speed;
        if (x < 10) passedCount++;
      }

      // Filter out off-screen cars
      if (x >= 0 && x <= 800 && y >= 0 && y <= 600) {
        updatedVehicles.push({
          ...v,
          lane: currentLane,
          x,
          y,
          speed,
          stopped,
          waitingTime,
        });
      }
    }
  });

  return { updatedVehicles, passedCount };
}
