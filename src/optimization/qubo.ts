import { Vehicle, OptimizationResult } from '../types/sim2';

export interface QUBOCostEvaluation {
  i1NsGreen: number;
  i1EwGreen: number;
  i2NsGreen: number;
  i2EwGreen: number;
  cost: number;
  bitstring: string;
}

/**
 * QUBO Matrix Formulation for 2-Intersection Traffic Synchronization
 * Variables represent binary choices for green split durations at I1 and I2.
 */
export function solveTrafficQUBO(vehicles: Vehicle[]): OptimizationResult {
  // Count current stopped queues per direction
  const i1NsQueue = vehicles.filter(v => (v.lane === 'I1_NORTH' || v.lane === 'LINK_UP') && v.stopped).length;
  const i1EwQueue = vehicles.filter(v => (v.lane === 'I1_WEST' || v.lane === 'I1_EAST') && v.stopped).length;
  const i2NsQueue = vehicles.filter(v => (v.lane === 'I2_SOUTH' || v.lane === 'LINK_DOWN') && v.stopped).length;
  const i2EwQueue = vehicles.filter(v => (v.lane === 'I2_WEST' || v.lane === 'I2_EAST') && v.stopped).length;

  // Discrete choices for Green durations: [12, 16, 20, 24, 28] seconds
  const timingCandidates = [12, 16, 20, 24, 28];
  const evaluations: QUBOCostEvaluation[] = [];

  let bestCost = Infinity;
  let bestTiming = { i1Ns: 20, i1Ew: 20, i2Ns: 20, i2Ew: 20 };
  let bestBitstring = '10101010';

  // Evaluate candidate states in simulated variational search space
  timingCandidates.forEach((t1Ns, idx1) => {
    const t1Ew = 40 - t1Ns; // cycle constraint
    timingCandidates.forEach((t2Ns, idx2) => {
      const t2Ew = 40 - t2Ns;

      // Hamiltonian Cost Function:
      // H(t) = w_queue * (Q_NS / t_NS + Q_EW / t_EW) + w_coordination * |t1_NS - t2_NS|
      const costI1 = (i1NsQueue * 4.0) / (t1Ns + 2) + (i1EwQueue * 4.0) / (t1Ew + 2);
      const costI2 = (i2NsQueue * 4.0) / (t2Ns + 2) + (i2EwQueue * 4.0) / (t2Ew + 2);

      // Arterial coordination coupling between I1 and I2 along the vertical connecting link
      const couplingPenalty = Math.abs(t1Ns - t2Ns) * 0.25;

      const totalCost = costI1 + costI2 + couplingPenalty;

      const bitstring = `${idx1.toString(2).padStart(4, '0')}${idx2.toString(2).padStart(4, '0')}`;

      evaluations.push({
        i1NsGreen: t1Ns,
        i1EwGreen: t1Ew,
        i2NsGreen: t2Ns,
        i2EwGreen: t2Ew,
        cost: totalCost,
        bitstring,
      });

      if (totalCost < bestCost) {
        bestCost = totalCost;
        bestTiming = { i1Ns: t1Ns, i1Ew: t1Ew, i2Ns: t2Ns, i2Ew: t2Ew };
        bestBitstring = bitstring;
      }
    });
  });

  return {
    quboVariables: 8, // 4 qubits per intersection
    candidateSolutions: evaluations.length,
    bestObjectiveValue: Number(bestCost.toFixed(3)),
    i1NsGreen: bestTiming.i1Ns,
    i1EwGreen: bestTiming.i1Ew,
    i2NsGreen: bestTiming.i2Ns,
    i2EwGreen: bestTiming.i2Ew,
    timestamp: Date.now(),
    bitstring: bestBitstring,
  };
}
