from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PodMetric(BaseModel):
    pod_name: str
    namespace: str
    cpu_usage_core: float
    memory_usage_bytes: int
    timestamp: datetime

class AnomalyEvent(BaseModel):
    id: str
    service_name: str
    anomaly_type: str # e.g., 'cpu_spike', 'memory_leak'
    severity: str # 'low', 'medium', 'high', 'critical'
    description: str
    detected_at: datetime
