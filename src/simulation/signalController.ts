import { IntersectionSignal, SignalState } from '../types/sim2';

export const DEFAULT_NORMAL_TIMING = {
  nsGreen: 20,
  ewGreen: 20,
  yellow: 3,
  red: 20,
};

export function createInitialSignals(): { i1: IntersectionSignal; i2: IntersectionSignal } {
  return {
    i1: {
      id: 'I1',
      name: 'Intersection 1 (North Hub)',
      currentPhase: 'NS',
      nsLight: 'GREEN',
      ewLight: 'RED',
      countdown: 20,
      nsGreenDuration: 20,
      ewGreenDuration: 20,
      yellowDuration: 3,
      redDuration: 20,
    },
    i2: {
      id: 'I2',
      name: 'Intersection 2 (South Hub)',
      currentPhase: 'EW',
      nsLight: 'RED',
      ewLight: 'GREEN',
      countdown: 20,
      nsGreenDuration: 20,
      ewGreenDuration: 20,
      yellowDuration: 3,
      redDuration: 20,
    },
  };
}

export function updateSignalTick(signal: IntersectionSignal, dt: number): IntersectionSignal {
  let { currentPhase, nsLight, ewLight, countdown, nsGreenDuration, ewGreenDuration, yellowDuration } = signal;

  countdown -= dt;

  if (countdown <= 0) {
    if (currentPhase === 'NS') {
      if (nsLight === 'GREEN') {
        nsLight = 'YELLOW';
        countdown = yellowDuration;
      } else if (nsLight === 'YELLOW') {
        nsLight = 'RED';
        ewLight = 'GREEN';
        currentPhase = 'EW';
        countdown = ewGreenDuration;
      }
    } else {
      if (ewLight === 'GREEN') {
        ewLight = 'YELLOW';
        countdown = yellowDuration;
      } else if (ewLight === 'YELLOW') {
        ewLight = 'RED';
        nsLight = 'GREEN';
        currentPhase = 'NS';
        countdown = nsGreenDuration;
      }
    }
  }

  return {
    ...signal,
    currentPhase,
    nsLight,
    ewLight,
    countdown: Math.max(0, countdown),
  };
}
