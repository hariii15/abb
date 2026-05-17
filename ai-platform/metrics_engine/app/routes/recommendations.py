from fastapi import APIRouter
from app.services.recommendation_service import RecommendationService

router = APIRouter()
service = RecommendationService()

@router.get("/")
def get_recommendations():
    """
    Returns a list of AI-generated recommendations and YAML patches for detected anomalies.
    """
    recommendations = service.get_current_recommendations()
    return {
        "status": "success",
        "data": recommendations
    }
