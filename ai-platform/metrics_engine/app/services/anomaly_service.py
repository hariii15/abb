import pandas as pd
from app.collectors.cpu_collector import CPUCollector
from app.collectors.memory_collector import MemoryCollector
from anomaly_engine.main import AnomalyEngine
from shared.logging.logger import get_logger
from datetime import datetime, timedelta

logger = get_logger(__name__)

class AnomalyService:
    def __init__(self):
        self.cpu_collector = CPUCollector()
        self.memory_collector = MemoryCollector()
        self.engine = AnomalyEngine()

    def detect_anomalies(self):
        """
        Fetches current metrics and runs detection.
        """
        try:
            from app.routes.pods import get_pod_summary
            summary = get_pod_summary().get("data", {})
            
            if not summary:
                return []
            
            # Convert summary into a list of records
            records = []
            
            for pod, stats in summary.items():
                cpu_val = float(stats.get('cpu', 0.0)) / 1000.0 # Convert millicores back to cores for engine
                mem_val = float(stats.get('memory', 0.0))
                restart_val = int(stats.get('restarts', 0))
                storage_val = float(stats.get('storage', 0.0))
                
                # Create a record for the engine
                records.append({
                    "pod": pod,
                    "cpu_usage": cpu_val,
                    "memory_usage": mem_val,
                    "restarts": restart_val,
                    "storage_usage": storage_val
                })
            
            df = pd.DataFrame(records)
            return self.engine.detect_anomalies(df)
            
        except Exception as e:
            logger.error(f"Anomaly service failed: {e}")
            return []
