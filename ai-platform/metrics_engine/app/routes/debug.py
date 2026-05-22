from fastapi import APIRouter, Body
from app.routes.pods import get_pod_summary
from anomaly_engine.main import AnomalyEngine
from agent_engine.graph import agent_graph
from agent_engine.agents.higher_agents import _format_metric_proof
import json
import time

router = APIRouter()
anomaly_engine = AnomalyEngine()

@router.get("/check_key")
def check_key():
    import os
    from shared.llm.openrouter_client import API_KEY
    return {
        "OPENROUTER_API_KEY_ENV": os.getenv("OPENROUTER_API_KEY")[:15] + "..." if os.getenv("OPENROUTER_API_KEY") else "None",
        "API_KEY_IMPORTED": API_KEY[:15] + "..." if API_KEY else "None",
        "CURRENT_WORKING_DIR": os.getcwd(),
        "SERVICES_ENV_EXISTS": os.path.exists("/home/hari/abb/services/.env")
    }

@router.get("/llm_payload")
def get_llm_payload():
    """
    Returns the exact formatted evidence block and prompts sent to the LLM.
    If no anomalies are active, it provides a simulated preview payload.
    """
    # 1. Gather live metrics
    summary_data = get_pod_summary().get("data", {})
    
    # 2. Convert to DataFrame-like format for anomaly detection
    df_records = []
    for pod_name, stats in summary_data.items():
        df_records.append({
            "pod": pod_name,
            "cpu_usage": stats.get("cpu", 0) / 1000.0, # convert back to cores
            "memory_usage": stats.get("memory", 0),
            "restarts": stats.get("restarts", 0),
            "storage_usage": stats.get("storage", 0)
        })
    
    import pandas as pd
    df = pd.DataFrame(df_records)
    
    # Detect real anomalies
    anomalies = anomaly_engine.detect_anomalies(df)
    simulated = False
    
    # If no anomalies are active, construct a simulated one for preview
    if not anomalies:
        simulated = True
        anomalies = [{
            "service": "cctv-service-7b758f797b-p5vl2",
            "type": "cpu_spike",
            "severity": "critical",
            "description": "CPU spike: 980m exceeds critical threshold.",
            "timestamp": "2026-05-17T19:00:00"
        }]
        # Override cctv metrics in summary for evidence block
        summary_data["cctv-service-7b758f797b-p5vl2"] = {
            "cpu": 980.0,
            "memory": 16.5,
            "restarts": 0,
            "network": {"rx": 4.9, "tx": 4.9},
            "storage": 0.0
        }
        
    # 3. Format evidence block
    evidence = _format_metric_proof(anomalies, summary_data, {"cctv-service": "Dependency alert on api-gateway"})
    
    # 4. Formulate prompts
    root_cause_prompt = f"""You are KubeMind Core, an expert autonomous Kubernetes SRE AI.
    
You have detected infrastructure anomalies. Below is the full evidence including live metrics at the time of detection.

{evidence}

Task: Write a 2-3 sentence Root Cause Analysis... (Coherent paragraph citing metrics)"""

    recommendation_prompt = f"""You are KubeMind Core. Given the following infrastructure anomaly evidence, provide ONE concrete remediation action.

{evidence}

Respond with:
ACTION: <exact kubectl command>
REASON: <1 sentence explaining why this fixes the root cause>"""

    forecasting_prompt = f"""You are KubeMind Core. An anomaly has been detected. Below is the metric trend.

ANOMALY: {json.dumps(anomalies[0])}

METRIC TREND (last 3 samples):
  T-2: CPU=120m MEM=16.5MB
  T-1: CPU=450m MEM=16.5MB
  T-0: CPU=980m MEM=16.5MB

Task: Write 1 sentence predicting what will happen in the next 60 minutes..."""

    return {
        "status": "success",
        "simulated_preview": simulated,
        "anomalies": anomalies,
        "metrics_summary": summary_data,
        "evidence_block": evidence,
        "prompts": {
            "root_cause_agent": root_cause_prompt.strip(),
            "recommendation_agent": recommendation_prompt.strip(),
            "forecasting_agent": forecasting_prompt.strip()
        }
    }

@router.post("/trigger_llm")
def trigger_llm(custom_payload: dict = Body(default=None)):
    """
    Invokes the KubeMind Agent Graph with the provided custom payload or current live state.
    Executes the 3 LLM agents (Llama-3 via OpenRouter) and returns the final reasoning and trace.
    """
    initial_state = {}
    
    if custom_payload:
        # Use custom JSON payload sent by the user
        initial_state = {
            "metrics_summary": custom_payload.get("metrics_summary", {}),
            "metrics_history": custom_payload.get("metrics_history", [custom_payload.get("metrics_summary", {})]),
            "anomalies": custom_payload.get("anomalies", []),
            "correlations": custom_payload.get("correlations", {}),
            "topology": {},
            "root_cause_analysis": {},
            "recommendations": [],
            "forecast_narrative": {},
            "execution_trace": []
        }
    else:
        # Fetch current live state
        summary_data = get_pod_summary().get("data", {})
        df_records = []
        for pod_name, stats in summary_data.items():
            df_records.append({
                "pod": pod_name,
                "cpu_usage": stats.get("cpu", 0) / 1000.0,
                "memory_usage": stats.get("memory", 0),
                "restarts": stats.get("restarts", 0),
                "storage_usage": stats.get("storage", 0)
            })
            
        import pandas as pd
        df = pd.DataFrame(df_records)
        anomalies = anomaly_engine.detect_anomalies(df)
        
        # If no active anomalies, inject the simulated CPU spike so the LLM agents actually run!
        if not anomalies:
            anomalies = [{
                "service": "cctv-service-7b758f797b-p5vl2",
                "type": "cpu_spike",
                "severity": "critical",
                "description": "CPU spike: 980m exceeds critical threshold.",
                "timestamp": "2026-05-17T19:00:00"
            }]
            summary_data["cctv-service-7b758f797b-p5vl2"] = {
                "cpu": 980.0,
                "memory": 16.5,
                "restarts": 0,
                "network": {"rx": 4.9, "tx": 4.9},
                "storage": 0.0
            }
            
        initial_state = {
            "metrics_summary": summary_data,
            "metrics_history": [summary_data],
            "anomalies": anomalies,
            "correlations": {"cctv-service": "Dependency alert on api-gateway"},
            "topology": {},
            "root_cause_analysis": {},
            "recommendations": [],
            "forecast_narrative": {},
            "execution_trace": []
        }
        
    # Execute the LangGraph workflow
    try:
        final_state = agent_graph.invoke(initial_state)
        return {
            "status": "success",
            "root_cause": final_state.get("root_cause_analysis"),
            "recommendations": final_state.get("recommendations"),
            "forecast": final_state.get("forecast_narrative"),
            "execution_trace": final_state.get("execution_trace")
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
