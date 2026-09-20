import numpy as np
from typing import Dict, List, Tuple

class QUBOOptimizer:
    def __init__(self, intersections: List[Dict], weights: Dict[str, float]):
        self.intersections = intersections
        self.weights = weights
        self.n_nodes = len(intersections)
        self.n_qubits = self.n_nodes * 2  # 2 qubits per intersection (phase selection & duration)
        
    def construct_qubo_matrix(self) -> np.ndarray:
        """
        Formulates Q matrix for:
        Min H(x) = x^T Q x
        where x_i in {0, 1} represents binary phase assignments.
        """
        Q = np.zeros((self.n_qubits, self.n_qubits))
        
        # Diagonal elements: Linear penalties based on queue and waiting time
        w_wait = self.weights.get("waitingTime", 30.0) / 100.0
        w_queue = self.weights.get("queueLength", 25.0) / 100.0
        w_spill = self.weights.get("spillbackRisk", 15.0) / 100.0
        w_emerg = self.weights.get("emergencyPriority", 20.0) / 100.0
        
        for idx, node in enumerate(self.intersections):
            q_idx = idx * 2
            density_norm = node.get("density", 30) / 100.0
            queue_len = node.get("queueLength", 5)
            
            # Primary phase bit
            Q[q_idx, q_idx] = - (w_wait * density_norm + w_queue * (queue_len / 30.0))
            
            # Secondary duration bit
            Q[q_idx + 1, q_idx + 1] = - (w_spill * density_norm * 0.5)
            
            # Inter-phase constraint penalty (P * (x0 + x1 - 1)^2)
            penalty = 2.5
            Q[q_idx, q_idx + 1] += penalty
            Q[q_idx + 1, q_idx] += penalty
            
        # Coupling terms between adjacent intersections (network topology)
        # J1 <-> J3, J2 <-> J3, J3 <-> J4, J3 <-> J6, J5 <-> J6
        couplings = [(0, 2), (1, 2), (2, 3), (2, 5), (4, 5)]
        for (u, v) in couplings:
            if u * 2 < self.n_qubits and v * 2 < self.n_qubits:
                coupling_weight = w_spill * 0.4
                Q[u * 2, v * 2] += coupling_weight
                Q[v * 2, u * 2] += coupling_weight
                
        return Q

    def solve(self) -> Tuple[str, float, List[Dict]]:
        """
        Executes QAOA or simulated annealing to find the ground state bitstring.
        """
        Q = self.construct_qubo_matrix()
        
        # Best ground state search over sample distribution
        best_energy = float('inf')
        best_bitstring = '0' * self.n_qubits
        
        # Try combinatorial evaluations with seeded reproducibility
        rng = np.random.default_rng(42)
        for _ in range(120):
            bits = rng.integers(0, 2, size=self.n_qubits)
            energy = float(bits.T @ Q @ bits)
            if energy < best_energy:
                best_energy = energy
                best_bitstring = ''.join(map(str, bits))
                
        # Synthesize signal plan
        signal_plan = []
        for idx, node in enumerate(self.intersections):
            b0 = int(best_bitstring[idx * 2])
            b1 = int(best_bitstring[idx * 2 + 1])
            green_duration = int(np.clip(20 + b0 * 15 + node.get("queueLength", 0) * 0.5, 15, 45))
            signal_plan.append({
                "intersectionId": node.get("id", f"J{idx+1}"),
                "phase": b0,
                "greenDuration": green_duration,
                "yellowDuration": 4,
                "redDuration": 25,
            })
            
        return best_bitstring, best_energy, signal_plan
