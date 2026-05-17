from fastapi import APIRouter
from app.services.forecasting_service import ForecastingService

router = APIRouter()
service = ForecastingService()

@router.get("/")
def get_forecasts():
    """
    Returns AI-generated resource usage forecasts for the next 6 hours.
    """
    data = service.get_resource_forecasts()
    return {
        "status": "success",
        "data": data
    }
