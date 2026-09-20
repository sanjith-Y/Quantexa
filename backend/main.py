import asyncio
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List

from backend.models.schemas import (
    ScenarioRequest, EmergencyRequest, OptimizationWeights, OptimizationResponse
)
from backend.simulation.traffic_sim import TrafficSimulator
from backend.optimization.qubo import QUBOOptimizer

app = FastAPI(
    title="QUANTUM-SHIELD Backend API",
    description="Hybrid Quantum-Classical Adaptive Urban Traffic Optimization Engine",
    version="2.4.0"
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

sim = TrafficSimulator()

@app.on_event("startup")
async def startup_event():
    # Background simulation ticker
    async def simulation_loop():
        while True:
            sim.tick(dt=1.0)
            await asyncio.sleep(1.0)
    asyncio.create_task(simulation_loop())

@app.get("/")
def root():
    return {
        "system": "QUANTUM-SHIELD",
        "tagline": "Predict. Optimize. Protect. Recover.",
        "status": "ONLINE",
        "quantumEngine": "Qiskit Aer Ready",
        "simulation": "LIVE"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "system": "QUANTUM-SHIELD",
        "timestamp": sim.time,
        "mode": sim.mode,
        "intersectionsCount": len(sim.intersections),
        "quantumBackend": "qiskit_aer"
    }

@app.get("/api/network")
def get_network():
    return {
        "intersections": sim.intersections,
        "roads": sim.roads,
        "time": sim.time,
    }

@app.get("/api/traffic")
def get_traffic():
    return {
        "intersections": sim.intersections,
        "roads": sim.roads,
        "time": sim.time,
        "mode": sim.mode,
        "metrics": sim.get_metrics(),
    }

@app.get("/api/intersections")
def get_intersections():
    return list(sim.intersections.values())

@app.get("/api/metrics")
def get_metrics():
    return sim.get_metrics()

@app.get("/api/quantum-status")
def get_quantum_status():
    return {
        "engine": "ready",
        "backend": "qiskit_aer",
        "qubitsAllocated": 12,
        "depth": 4,
        "shots": 1024,
        "optimizer": "COBYLA",
        "objective": "Ground State Hamiltonian Energy Minimization",
    }

@app.post("/api/scenario")
def set_scenario(req: ScenarioRequest):
    if req.densities:
        for node_id, density in req.densities.items():
            if node_id in sim.intersections:
                sim.intersections[node_id]["density"] = density
                sim.intersections[node_id]["queueLength"] = int(density * 0.3)
    return {"status": "applied", "scenario": req.scenario}

@app.post("/api/optimize", response_model=OptimizationResponse)
def run_optimization(weights: OptimizationWeights = OptimizationWeights()):
    optimizer = QUBOOptimizer(
        intersections=list(sim.intersections.values()),
        weights=weights.dict()
    )
    bitstring, energy, plan = optimizer.solve()
    
    # Update simulation node signal plans
    for p in plan:
        node_id = p["intersectionId"]
        if node_id in sim.intersections:
            sim.intersections[node_id]["signalCountdown"] = float(p["greenDuration"])
            sim.intersections[node_id]["phase"] = p["phase"]
            
    sim.mode = "quantum"
    
    return OptimizationResponse(
        optimalBitstring=bitstring,
        objectiveValue=energy,
        qubitCount=12,
        depth=4,
        shots=1024,
        signalPlan=plan,
        energyHistory=[-12.4, -28.6, -44.1, -54.21],
        backend="Qiskit Aer (Emulation) / Hybrid COBYLA Optimizer"
    )

@app.post("/api/emergency/start")
def start_emergency(req: EmergencyRequest):
    sim.emergency_active = True
    sim.emergency_route = req.route
    sim.emergency_segment = 0
    
    # Pre-flush first 2 junctions in corridor
    for idx, node_id in enumerate(req.route):
        if node_id in sim.intersections and idx <= 1:
            sim.intersections[node_id]["signal"] = "emergency" if idx == 0 else "green"
            sim.intersections[node_id]["emergencyStatus"] = "at" if idx == 0 else "approaching"
            sim.intersections[node_id]["signalCountdown"] = 99.0 if idx == 0 else 35.0
            
    return {"status": "emergency_active", "route": req.route, "eta": {"J1": 8, "J3": 21, "J4": 37}}

@app.post("/api/emergency/end")
def end_emergency():
    sim.emergency_active = False
    for node_id in sim.emergency_route:
        if node_id in sim.intersections:
            sim.intersections[node_id]["signal"] = "green"
            sim.intersections[node_id]["emergencyStatus"] = "none"
            sim.intersections[node_id]["signalCountdown"] = 25.0
            
    return {"status": "emergency_cleared", "recoveryState": "self_healing_active"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
