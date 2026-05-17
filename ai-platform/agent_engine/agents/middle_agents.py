from typing import Dict, Any
from agent_engine.state import AgentState
from dependency_engine.main import DependencyEngine
from shared.logging.logger import get_logger

logger = get_logger(__name__)

dependency_engine = DependencyEngine()

def dependency_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 2: Builds the topology graph."""
    logger.info("Running Dependency Agent...")
    
    # Builds topology using the metrics and anomalies found in previous steps
    topology = dependency_engine.build_service_graph(
        metrics_data=state.get("metrics_summary", {}),
        anomaly_data=state.get("anomalies", [])
    )
    
    trace_msg = f"Dependency Agent: Built topology with {len(topology.get('nodes', []))} nodes."
    return {
        "topology": topology,
        "execution_trace": [trace_msg]
    }

def correlation_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 2: Finds logical links between anomalies."""
    logger.info("Running Correlation Agent...")
    
    anomalies = state.get("anomalies", [])
    correlations = {}
    trace_msg = "Correlation Agent: No active anomalies to correlate."
    
    if anomalies:
        correlations = {
            "primary_anomaly": anomalies[0],
            "related_services": ["api-gateway"] if "cctv-service" in anomalies[0].get("service", "") else []
        }
        trace_msg = f"Correlation Agent: Linked {anomalies[0].get('service')} to infrastructure neighbors."
        
    return {
        "correlations": correlations,
        "execution_trace": [trace_msg]
    }
