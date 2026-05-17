from langgraph.graph import StateGraph, END
from agent_engine.state import AgentState
from agent_engine.agents.lower_agents import cpu_agent, memory_agent, network_agent, storage_agent
from agent_engine.agents.middle_agents import dependency_agent, correlation_agent
from agent_engine.agents.higher_agents import root_cause_agent, recommendation_agent, forecasting_agent

def anomaly_gatekeeper(state: AgentState):
    """
    Conditional router: If no anomalies were found by Layer 1, skip Layer 3 (LLMs) completely.
    """
    if len(state.get("anomalies", [])) > 0:
        return "reasoning_layer"
    return "end"

def build_agent_graph():
    """Compiles the 9-Agent Enterprise LangGraph."""
    workflow = StateGraph(AgentState)
    
    # Add Nodes (Layer 1)
    workflow.add_node("cpu_agent", cpu_agent)
    workflow.add_node("memory_agent", memory_agent)
    workflow.add_node("network_agent", network_agent)
    workflow.add_node("storage_agent", storage_agent)
    
    # Add Nodes (Layer 2)
    workflow.add_node("dependency_agent", dependency_agent)
    workflow.add_node("correlation_agent", correlation_agent)
    
    # Add Nodes (Layer 3)
    workflow.add_node("root_cause_agent", root_cause_agent)
    workflow.add_node("recommendation_agent", recommendation_agent)
    workflow.add_node("forecasting_agent", forecasting_agent)
    
    # Build Edges
    # Layer 1 runs in parallel conceptually, but we define a sequence for state passing
    workflow.set_entry_point("cpu_agent")
    workflow.add_edge("cpu_agent", "memory_agent")
    workflow.add_edge("memory_agent", "network_agent")
    workflow.add_edge("network_agent", "storage_agent")
    
    # Move to Layer 2
    workflow.add_edge("storage_agent", "dependency_agent")
    workflow.add_edge("dependency_agent", "correlation_agent")
    
    # Gatekeeper routing
    workflow.add_conditional_edges(
        "correlation_agent",
        anomaly_gatekeeper,
        {
            "reasoning_layer": "root_cause_agent",
            "end": END
        }
    )
    
    # Layer 3 Sequence
    workflow.add_edge("root_cause_agent", "recommendation_agent")
    workflow.add_edge("recommendation_agent", "forecasting_agent")
    workflow.add_edge("forecasting_agent", END)
    
    return workflow.compile()

# Singleton graph instance
agent_graph = build_agent_graph()
