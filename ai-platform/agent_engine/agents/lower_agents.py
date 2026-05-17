from typing import Dict, Any
from agent_engine.state import AgentState
from metrics_engine.app.services.anomaly_service import AnomalyService
from shared.logging.logger import get_logger

logger = get_logger(__name__)

# We use the existing AnomalyService to power the deterministic detection
anomaly_service = AnomalyService()

def cpu_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes CPU metrics deterministically."""
    logger.info("Running CPU Agent...")
    
    # In a real setup, we'd slice the metrics_summary to just CPU, 
    # but our anomaly_service handles pulling the live data internally for now.
    anomalies = anomaly_service.detect_anomalies()
    
    # Filter for CPU spikes
    cpu_anomalies = [a for a in anomalies if a.get("type") == "cpu_spike"]
    
    max_cpu = max([a.get('value', 0) for a in anomalies]) if anomalies else 0
    trace_msg = f"CPU Agent: Analyzing {len(anomalies)} pods. Max Load: {max_cpu:.2f} cores."
    if cpu_anomalies:
        trace_msg = f"CPU Agent: Detected SPIKE ({cpu_anomalies[0].get('value'):.2f} cores) in {cpu_anomalies[0].get('service')}"

    return {
        "anomalies": cpu_anomalies,
        "execution_trace": [trace_msg]
    }

def memory_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Memory metrics deterministically."""
    logger.info("Running Memory Agent...")
    anomalies = state.get("anomalies", [])
    mem_anomalies = [a for a in anomalies if a.get("type") == "memory_leak"]
    
    trace_msg = "Memory Agent: Scanning for leaks..."
    if mem_anomalies:
        trace_msg = f"Memory Agent: Detected potential leak in {mem_anomalies[0].get('service')}"
    
    return {
        "execution_trace": [trace_msg]
    }

def network_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Network metrics deterministically."""
    logger.info("Running Network Agent...")
    return {
        "execution_trace": ["Network Agent (Deterministic)"]
    }

def storage_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 1: Analyzes Storage metrics deterministically."""
    logger.info("Running Storage Agent...")
    anomalies = state.get("anomalies", [])
    storage_anomalies = [a for a in anomalies if a.get("type") == "storage_pressure"]
    
    trace_msg = "Storage Agent: Checking PVC health..."
    if storage_anomalies:
        trace_msg = f"Storage Agent: CRITICAL PRESSURE on {storage_anomalies[0].get('service')} volume."
        
    return {
        "execution_trace": [trace_msg]
    }
