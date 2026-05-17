import pandas as pd
from app.collectors.cpu_collector import CPUCollector
from app.collectors.memory_collector import MemoryCollector
from forecasting_engine.main import ForecastingEngine
from shared.logging.logger import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)

class ForecastingService:
    def __init__(self):
        self.cpu_collector = CPUCollector()
        self.memory_collector = MemoryCollector()
        self.engine = ForecastingEngine()

    def get_resource_forecasts(self):
        """
        Generates forecasts for all pods.
        """
        try:
            raw_cpu = self.cpu_collector.get_pod_cpu_usage()
            if not isinstance(raw_cpu, list):
                logger.warning(f"Forecasting failed: raw_cpu is not a list: {type(raw_cpu)}")
                return []
                
            forecasts = []

            for item in raw_cpu:
                if not isinstance(item, dict) or 'pod' not in item: continue
                pod = item.get('pod')
                if not pod: continue

                val = float(item.get('value', 0.0))
                
                # Mocking historical series for the Prophet model
                # (In production, this would be a real Prometheus range query)
                history = []
                now = datetime.now()
                for i in range(24):
                    # Create a slightly increasing mock trend
                    history.append({
                        "ds": now - timedelta(hours=24-i),
                        "y": val * (0.8 + (i * 0.01)) 
                    })
                
                df = pd.DataFrame(history)
                prediction = self.engine.predict_future_usage(df)
                
                if prediction:
                    forecasts.append({
                        "service": pod,
                        "resource": "CPU",
                        "current_value": val,
                        "forecast": prediction
                    })

            return forecasts
        except Exception as e:
            logger.error(f"Forecasting service failed: {e}")
            return []
