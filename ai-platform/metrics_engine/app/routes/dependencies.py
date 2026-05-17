from fastapi import APIRouter
from dependency_engine.main import DependencyEngine
from app.services.anomaly_service import AnomalyService
from app.routes.pods import get_pod_summary

router = APIRouter()
engine = DependencyEngine()
anomaly_service = AnomalyService()

@router.get("/")
def get_dependency_graph():
    """
    Returns an enriched service topology including health and traffic.
    """
    # Fetch live state to enrich the graph
    summary = get_pod_summary()["data"]
    anomalies = anomaly_service.detect_anomalies()
    
    graph_data = engine.build_service_graph(metrics_data=summary, anomaly_data=anomalies)
    
    return {
        "status": "success",
        "data": graph_data
    }
