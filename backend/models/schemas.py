from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Literal

class IntersectionSchema(BaseModel):
    id: str
    name: str
    x: float
    y: float
    density: float
    queueLength: int
    capacity: int
    signal: Literal['green', 'yellow', 'red', 'emergency']
    signalCountdown: float
    phase: int
    riskLevel: Literal['low', 'medium', 'high', 'critical']
    waitingTime: float
    throughput: float
    spillbackRisk: float
    emergencyStatus: Literal['none', 'approaching', 'at', 'cleared']
    co2Rate: float
    predictedQueue: int
    isBlocked: bool = False

class RoadSchema(BaseModel):
    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    capacity: int
    currentFlow: int
    isEmergencyRoute: bool = False
    isBlocked: bool = False

class OptimizationWeights(BaseModel):
    waitingTime: float = 30.0
    queueLength: float = 25.0
    emergencyPriority: float = 20.0
    spillbackRisk: float = 15.0
    co2: float = 10.0
    switchingCost: float = 10.0

class ScenarioRequest(BaseModel):
    scenario: str
    densities: Optional[Dict[str, float]] = None

class EmergencyRequest(BaseModel):
    vehicleId: str = "AMB-001"
    route: List[str] = ["J1", "J3", "J4"]
    destination: str = "City Hospital"

class OptimizationResponse(BaseModel):
    optimalBitstring: str
    objectiveValue: float
    qubitCount: int
    depth: int
    shots: int
    signalPlan: List[Dict]
    energyHistory: List[float]
    backend: str = "Qiskit Aer (Emulation) / Classical Scipy Fallback"
