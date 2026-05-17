from fastapi import APIRouter
from app.collectors.pod_collector import PodCollector

router = APIRouter()
pod_collector = PodCollector()

@router.get("/")
def get_namespaces():
    data = pod_collector.get_all_namespaces()
    return {"status": "success", "data": data}
