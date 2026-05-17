from typing import TypedDict, Annotated, List, Dict, Any
from operator import add

class AgentState(TypedDict):
    # Inputs
    metrics_summary: Dict[str, Any]
    metrics_history: Annotated[List[Dict[str, Any]], add]
    
    # Layer 1: Deterministic Outputs
    anomalies: Annotated[List[Dict[str, Any]], add]
    
    # Layer 2: Intelligence Outputs
    topology: Dict[str, Any]
    correlations: Dict[str, Any]
    
    # Layer 3: Reasoning Outputs
    root_cause_analysis: Dict[str, Any]
    recommendations: List[Dict[str, Any]]
    forecast_narrative: Dict[str, Any]
    
    # Frontend Tracker
    execution_trace: Annotated[List[str], add]
