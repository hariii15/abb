from fastapi import APIRouter

router = APIRouter()

@router.get("/cpu")
def get_cpu_metrics():
    # TODO: Fetch from Prometheus
    return {"status": "success", "data": []}

@router.get("/memory")
def get_memory_metrics():
    # TODO: Fetch from Prometheus
    return {"status": "success", "data": []}
