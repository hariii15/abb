from pydantic import BaseModel, Field
from typing import Optional

class PodMetric(BaseModel):
    pod: str
    namespace: Optional[str] = "default"

    # Core 5 metrics
    cpu: Optional[float] = 0.0          # millicores or seconds
    memory: Optional[float] = 0.0       # bytes (will be normalized later or kept as bytes)
    network_rx: Optional[float] = 0.0   # bytes
    network_tx: Optional[float] = 0.0   # bytes
    restarts: Optional[int] = 0         # count
    storage_usage: Optional[float] = 0.0 # percentage
    
    # Metadata
    timestamp: float
