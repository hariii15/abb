from fastapi import APIRouter
from app.services.anomaly_service import AnomalyService

router = APIRouter()
service = AnomalyService()

@router.get("/")
def get_anomalies():
    """
    Returns a list of currently detected infrastructure anomalies.
    """
    anomalies = service.detect_anomalies()
    return {
        "status": "success",
        "data": anomalies
    }
