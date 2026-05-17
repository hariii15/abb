from pydantic import BaseModel
from typing import Literal, Optional

class TopologyNode(BaseModel):
    id: str
    label: str
    type: str = "default"
    health: Literal["healthy", "warning", "critical"] = "healthy"
    cpu: Optional[str] = "0m"
    x: float
    y: float

class TopologyEdge(BaseModel):
    source: str
    target: str
    label: str
    weight: Optional[float] = 1.0
    animated: bool = True
