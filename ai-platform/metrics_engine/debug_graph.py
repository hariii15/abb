import sys
import os

# Add the correct paths to sys.path
sys.path.append("/home/hari/abb/ai-platform")
sys.path.append("/home/hari/abb/ai-platform/metrics_engine")

from agent_engine.graph import agent_graph

initial_state = {
    "metrics_summary": {},
    "anomalies": [],
    "topology": {},
    "correlations": {},
    "root_cause_analysis": {},
    "recommendations": [],
    "forecast_narrative": {},
    "execution_trace": []
}

print("Invoking graph...")
try:
    final_state = agent_graph.invoke(initial_state)
    print("Success!")
    print(f"Trace: {final_state.get('execution_trace')}")
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
