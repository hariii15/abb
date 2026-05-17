from fastapi import APIRouter
from app.collectors.pod_collector import PodCollector

router = APIRouter()
pod_collector = PodCollector()

@router.get("/")
def get_services():
    data = pod_collector.get_all_services()
    return {"status": "success", "data": data}
