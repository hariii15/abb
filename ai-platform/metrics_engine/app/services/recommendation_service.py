from app.services.anomaly_service import AnomalyService
from recommendation_engine.main import RecommendationEngine
from recommendation_engine.advisor import InfrastructureAdvisor
from shared.logging.logger import get_logger

logger = get_logger(__name__)

class RecommendationService:
    def __init__(self):
        self.anomaly_service = AnomalyService()
        self.engine = RecommendationEngine()
        self.advisor = InfrastructureAdvisor()

    def get_current_recommendations(self):
        """
        Gathers current anomalies and generates human-readable recommendations for them.
        """
        try:
            anomalies = self.anomaly_service.detect_anomalies()
            recommendations = []
            
            for anomaly in anomalies:
                # 1. Generate rule-based recommendation
                rec = self.engine.get_recommendation_for_anomaly(anomaly)
                
                # 2. Enrich with LLM explanation
                rec["explanation"] = self.advisor.get_explanation(anomaly, rec)
                
                recommendations.append(rec)
                
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation service failed: {e}")
            return []
