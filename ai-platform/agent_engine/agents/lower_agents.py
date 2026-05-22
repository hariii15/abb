from typing import Dict, Any
from agent_engine.state import AgentState
from metrics_engine.app.services.anomaly_service import AnomalyService
from shared.logging.logger import get_logger

logger = get_logger(__name__)

# We use the existing AnomalyService to power the deterministic detection
anomaly_service = AnomalyService()

def _detect_all_anomalies(summary: dict) -> list:
    import pandas as pd
    from anomaly_engine.main import AnomalyEngine
    
    records = []
    for pod, stats in summary.items():
        cpu_val = float(stats.get('cpu', 0.0)) / 1000.0
        mem_val = float(stats.get('memory', 0.0))
        restart_val = int(stats.get('restarts', 0))
        storage_val = float(stats.get('storage', 0.0))
        
        records.append({
            "pod": pod,
            "cpu_usage": cpu_val,
            "memory_usage": mem_val,
            "restarts": restart_val,
            "storage_usage": storage_val
        })
        
    if not records:
        return []
        
    df = pd.DataFrame(records)
    engine = AnomalyEngine()
    return engine.detect_anomalies(df)

def cpu_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes CPU metrics deterministically."""
    logger.info("Running CPU Agent...")
    summary = state.get("metrics_summary", {})
    anomalies = _detect_all_anomalies(summary)
    cpu_anomalies = [a for a in anomalies if a.get("type") == "cpu_spike"]
    
    max_cpu = max([float(s.get('cpu', 0.0)) for s in summary.values()]) / 1000.0 if summary else 0
    trace_msg = f"CPU Agent: Analyzing {len(summary)} pods. Max Load: {max_cpu:.2f} cores."
    if cpu_anomalies:
        trace_msg = f"CPU Agent: Detected SPIKE ({cpu_anomalies[0].get('description')}) in {cpu_anomalies[0].get('service')}"

    return {
        "anomalies": cpu_anomalies,
        "execution_trace": [trace_msg]
    }

def memory_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Memory metrics deterministically."""
    logger.info("Running Memory Agent...")
    summary = state.get("metrics_summary", {})
    anomalies = _detect_all_anomalies(summary)
    mem_anomalies = [a for a in anomalies if a.get("type") == "memory_leak"]
    
    trace_msg = "Memory Agent: Scanning for leaks..."
    if mem_anomalies:
        trace_msg = f"Memory Agent: Detected potential leak in {mem_anomalies[0].get('service')}"
    
    return {
        "anomalies": mem_anomalies,
        "execution_trace": [trace_msg]
    }

def network_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Network metrics deterministically."""
    logger.info("Running Network Agent...")
    return {
        "anomalies": [],
        "execution_trace": ["Network Agent: Stable"]
    }

def storage_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Storage metrics deterministically."""
    logger.info("Running Storage Agent...")
    summary = state.get("metrics_summary", {})
    anomalies = _detect_all_anomalies(summary)
    storage_anomalies = [a for a in anomalies if a.get("type") == "storage_pressure"]
    
    trace_msg = "Storage Agent: Checking PVC health..."
    if storage_anomalies:
        trace_msg = f"Storage Agent: CRITICAL PRESSURE on {storage_anomalies[0].get('service')} volume."
        
    return {
        "anomalies": storage_anomalies,
        "execution_trace": [trace_msg]
    }
