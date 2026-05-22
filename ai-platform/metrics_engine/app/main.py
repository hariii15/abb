from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import pods, namespaces, services, dependencies, anomalies, recommendations, forecasts, debug
from .websocket.stream import router as websocket_router

app = FastAPI(title="Smart Campus Metrics Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pods.router, prefix="/pods", tags=["Pods"])
app.include_router(namespaces.router, prefix="/namespaces", tags=["Namespaces"])
app.include_router(services.router, prefix="/services", tags=["Services"])
app.include_router(dependencies.router, prefix="/dependencies", tags=["Dependencies"])
app.include_router(anomalies.router, prefix="/anomalies", tags=["Anomalies"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(forecasts.router, prefix="/forecasts", tags=["Forecasts"])
app.include_router(debug.router, prefix="/debug", tags=["Debug"])
app.include_router(websocket_router, tags=["WebSocket"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "metrics-engine"}

@app.get("/agents/health")
def agent_health():
    try:
        from agent_engine.graph import agent_graph
        return {"status": "active", "graph": "compiled"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
