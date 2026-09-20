import random
from typing import Dict, List, Any

class TrafficSimulator:
    def __init__(self):
        self.time = 0.0
        self.mode = "quantum"
        self.emergency_active = False
        self.emergency_segment = 0
        self.emergency_route = ["J1", "J3", "J4"]
        
        self.intersections: Dict[str, Dict[str, Any]] = {
            "J1": {"id": "J1", "name": "Junction 1", "x": 400, "y": 80, "density": 35.0, "queueLength": 8, "capacity": 30, "signal": "green", "signalCountdown": 24.0, "phase": 0, "riskLevel": "low", "waitingTime": 14.0, "throughput": 18.0, "spillbackRisk": 0.0, "emergencyStatus": "none", "co2Rate": 28.0, "predictedQueue": 10, "isBlocked": False},
            "J2": {"id": "J2", "name": "Junction 2", "x": 200, "y": 200, "density": 42.0, "queueLength": 11, "capacity": 30, "signal": "green", "signalCountdown": 20.0, "phase": 0, "riskLevel": "low", "waitingTime": 18.0, "throughput": 16.0, "spillbackRisk": 0.0, "emergencyStatus": "none", "co2Rate": 33.0, "predictedQueue": 13, "isBlocked": False},
            "J3": {"id": "J3", "name": "Junction 3", "x": 400, "y": 200, "density": 58.0, "queueLength": 16, "capacity": 35, "signal": "green", "signalCountdown": 30.0, "phase": 0, "riskLevel": "medium", "waitingTime": 24.0, "throughput": 22.0, "spillbackRisk": 12.0, "emergencyStatus": "none", "co2Rate": 46.0, "predictedQueue": 19, "isBlocked": False},
            "J4": {"id": "J4", "name": "Junction 4", "x": 600, "y": 200, "density": 38.0, "queueLength": 9, "capacity": 25, "signal": "green", "signalCountdown": 18.0, "phase": 0, "riskLevel": "low", "waitingTime": 15.0, "throughput": 17.0, "spillbackRisk": 0.0, "emergencyStatus": "none", "co2Rate": 30.0, "predictedQueue": 11, "isBlocked": False},
            "J5": {"id": "J5", "name": "Junction 5", "x": 200, "y": 320, "density": 45.0, "queueLength": 12, "capacity": 28, "signal": "green", "signalCountdown": 22.0, "phase": 0, "riskLevel": "low", "waitingTime": 19.0, "throughput": 15.0, "spillbackRisk": 0.0, "emergencyStatus": "none", "co2Rate": 36.0, "predictedQueue": 14, "isBlocked": False},
            "J6": {"id": "J6", "name": "Junction 6", "x": 400, "y": 320, "density": 40.0, "queueLength": 10, "capacity": 30, "signal": "green", "signalCountdown": 25.0, "phase": 0, "riskLevel": "low", "waitingTime": 16.0, "throughput": 18.0, "spillbackRisk": 0.0, "emergencyStatus": "none", "co2Rate": 32.0, "predictedQueue": 12, "isBlocked": False},
        }

        self.roads = [
            {"from": "J1", "to": "J3", "capacity": 20, "currentFlow": 8, "isEmergencyRoute": False, "isBlocked": False},
            {"from": "J2", "to": "J3", "capacity": 15, "currentFlow": 6, "isEmergencyRoute": False, "isBlocked": False},
            {"from": "J3", "to": "J4", "capacity": 18, "currentFlow": 9, "isEmergencyRoute": False, "isBlocked": False},
            {"from": "J3", "to": "J6", "capacity": 15, "currentFlow": 5, "isEmergencyRoute": False, "isBlocked": False},
            {"from": "J5", "to": "J6", "capacity": 12, "currentFlow": 4, "isEmergencyRoute": False, "isBlocked": False},
            {"from": "J1", "to": "J2", "capacity": 15, "currentFlow": 6, "isEmergencyRoute": False, "isBlocked": False},
        ]

    def tick(self, dt: float = 1.0):
        self.time += dt
        for node in self.intersections.values():
            if node["isBlocked"]:
                continue
            
            # Decrement signal countdown
            node["signalCountdown"] -= dt
            if node["signalCountdown"] <= 0:
                if node["signal"] == "green":
                    node["signal"] = "yellow"
                    node["signalCountdown"] = 4.0
                elif node["signal"] == "yellow":
                    node["signal"] = "red"
                    node["signalCountdown"] = 25.0
                else:
                    node["signal"] = "green"
                    node["signalCountdown"] = 32.0 if self.mode == "quantum" else 30.0
                    node["phase"] = (node["phase"] + 1) % 2
                    
            # Update density and queue length with mild random walk
            delta = random.choice([-1, 0, 1])
            node["queueLength"] = max(0, min(node["capacity"], node["queueLength"] + delta))
            node["density"] = max(5.0, min(100.0, (node["queueLength"] / node["capacity"]) * 100.0))
            node["waitingTime"] = node["density"] * (0.32 if self.mode == "quantum" else 0.45)
            node["co2Rate"] = node["density"] * 0.8
            node["spillbackRisk"] = max(0.0, node["density"] - 75.0)
            
            if node["density"] > 85:
                node["riskLevel"] = "critical"
            elif node["density"] > 70:
                node["riskLevel"] = "high"
            elif node["density"] > 50:
                node["riskLevel"] = "medium"
            else:
                node["riskLevel"] = "low"

    def get_metrics(self) -> Dict[str, Any]:
        nodes = list(self.intersections.values())
        avg_wait = sum(n["waitingTime"] for n in nodes) / len(nodes)
        total_thru = sum(n["throughput"] for n in nodes)
        total_co2 = sum(n["co2Rate"] for n in nodes)
        return {
            "time": self.time,
            "avgWaitingTime": avg_wait,
            "totalThroughput": total_thru,
            "totalCO2": total_co2,
            "mode": self.mode,
            "emergencyActive": self.emergency_active,
        }
