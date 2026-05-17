from typing import Dict, Any
from agent_engine.state import AgentState
from shared.llm.openrouter_client import get_llm
from langchain_core.messages import HumanMessage
from shared.logging.logger import get_logger
import json

logger = get_logger(__name__)


def _format_metric_proof(anomalies: list, metrics_summary: dict, correlations: dict) -> str:
    """Build a rich evidence block to send to the LLM so it can reason with proof."""
    lines = []

    # Anomaly summary
    for a in anomalies:
        svc = a.get("service", "unknown")
        atype = a.get("type", "unknown")
        severity = a.get("severity", "?")
        details = a.get("details", {})
        lines.append(f"[ANOMALY] {svc} → {atype} ({severity})")
        for k, v in details.items():
            lines.append(f"  {k}: {v}")

    # Live metric snapshot for each anomalous service
    lines.append("\n[LIVE METRICS AT TIME OF DETECTION]")
    anom_services = {a.get("service") for a in anomalies}
    for pod, stats in metrics_summary.items():
        svc = pod.split("-")[0] if "-" in pod else pod
        if svc in anom_services or pod in anom_services:
            cpu = stats.get("cpu", 0)
            mem = stats.get("memory", 0)
            restarts = stats.get("restarts", 0)
            net = stats.get("network", {})
            storage = stats.get("storage", 0)
            lines.append(
                f"  {pod}: CPU={cpu:.2f}m  MEM={mem:.1f}MB  "
                f"RESTARTS={restarts}  NET_RX={net.get('rx', 0):.2f}KB/s  "
                f"STORAGE={storage:.1f}%"
            )

    # Correlation context
    if correlations:
        lines.append("\n[CORRELATIONS]")
        for k, v in correlations.items():
            lines.append(f"  {k}: {v}")

    return "\n".join(lines)


def root_cause_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 3: Uses LLM to generate a human-readable root cause explanation with metric proof."""
    logger.info("Running Root Cause Agent (LLM)...")
    correlations = state.get("correlations", {})
    anomalies = state.get("anomalies", [])
    metrics_summary = state.get("metrics_summary", {})

    if not anomalies:
        return {"execution_trace": ["Root Cause Agent: Skipped (no anomalies)"]}

    evidence = _format_metric_proof(anomalies, metrics_summary, correlations)

    prompt = f"""You are KubeMind Core, an expert autonomous Kubernetes SRE AI.

You have detected infrastructure anomalies. Below is the full evidence including live metrics at the time of detection.

{evidence}

Task: Write a 2-3 sentence Root Cause Analysis that:
1. Names the specific service and metric that is failing
2. Explains WHY it is failing (infrastructure relationship, e.g. storage pressure causing OOM, or CPU spike causing retry amplification)
3. Cites the exact metric values as proof (e.g. "CPU spiked to 720m, exceeding the 700m threshold")

Be direct, technical, and authoritative. No bullet points — write as a coherent paragraph.
"""

    try:
        llm = get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        analysis = {
            "explanation": response.content,
            "evidence": evidence,
            "anomaly_count": len(anomalies)
        }
        trace_msg = f"Root Cause Agent: LLM reasoning complete ({len(anomalies)} anomalies)"
    except Exception as e:
        logger.error(f"LLM Error in root_cause_agent: {e}")
        analysis = {
            "explanation": f"LLM unavailable. Raw evidence: {evidence[:300]}",
            "evidence": evidence,
            "anomaly_count": len(anomalies)
        }
        trace_msg = "Root Cause Agent: LLM failed, fallback used"

    return {
        "root_cause_analysis": analysis,
        "execution_trace": [trace_msg]
    }


def recommendation_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 3: Uses LLM to generate actionable remediation with reasoning."""
    logger.info("Running Recommendation Agent (LLM)...")
    anomalies = state.get("anomalies", [])
    metrics_summary = state.get("metrics_summary", {})

    if not anomalies:
        return {"execution_trace": ["Recommendation Agent: Skipped (no anomalies)"]}

    evidence = _format_metric_proof(anomalies, metrics_summary, {})

    prompt = f"""You are KubeMind Core. Given the following infrastructure anomaly evidence, provide ONE concrete remediation action.

{evidence}

Respond with:
ACTION: <exact kubectl command or action, e.g. kubectl rollout restart deployment/auth-service -n default>
REASON: <1 sentence explaining why this fixes the root cause>

Format exactly as above.
"""

    try:
        llm = get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        content = response.content.strip()
        # Parse ACTION and REASON
        action_line = next((l for l in content.splitlines() if l.startswith("ACTION:")), "ACTION: kubectl describe pods")
        reason_line = next((l for l in content.splitlines() if l.startswith("REASON:")), "REASON: Investigate the issue.")
        action = action_line.replace("ACTION:", "").strip()
        reason = reason_line.replace("REASON:", "").strip()
        rec = [{"action": action, "explanation": reason, "service": anomalies[0].get("service", "cluster")}]
        trace_msg = f"Recommendation Agent: Action generated for {anomalies[0].get('service')}"
    except Exception as e:
        logger.error(f"LLM Error in recommendation_agent: {e}")
        rec = [{"action": "kubectl describe pods --all-namespaces", "explanation": "LLM unavailable. Manual investigation required.", "service": "cluster"}]
        trace_msg = "Recommendation Agent: LLM failed, fallback used"

    return {
        "recommendations": rec,
        "execution_trace": [trace_msg]
    }


def forecasting_agent(state: AgentState) -> Dict[str, Any]:
    """Layer 3: Uses LLM to generate a predictive forecast with metric trajectory."""
    logger.info("Running Forecasting Narrative Agent (LLM)...")
    anomalies = state.get("anomalies", [])
    metrics_history = state.get("metrics_history", [])

    if not anomalies:
        return {"execution_trace": ["Forecasting Agent: Skipped (no anomalies)"]}

    # Compute trend for the anomalous service
    trend_lines = []
    anom_service = anomalies[0].get("service", "")
    if len(metrics_history) >= 2:
        for i, snapshot in enumerate(metrics_history[-3:]):
            for pod, stats in snapshot.items():
                if pod.startswith(anom_service):
                    trend_lines.append(f"  T-{len(metrics_history[-3:]) - i}: CPU={stats.get('cpu', 0):.2f}m MEM={stats.get('memory', 0):.1f}MB")
    trend_block = "\n".join(trend_lines) if trend_lines else "  (insufficient history)"

    prompt = f"""You are KubeMind Core. An anomaly has been detected. Below is the metric trend.

ANOMALY: {json.dumps(anomalies[0])}

METRIC TREND (last 3 samples):
{trend_block}

Task: Write 1 sentence predicting what will happen in the next 60 minutes if this anomaly is NOT resolved.
Include the metric trajectory (e.g. "Memory growing at 50MB/min will cause OOM kill within 40 minutes").
"""

    try:
        llm = get_llm()
        response = llm.invoke([HumanMessage(content=prompt)])
        forecast = {"narrative": response.content, "trend": trend_block}
        trace_msg = f"Forecasting Agent: Prediction generated for {anom_service}"
    except Exception as e:
        logger.error(f"LLM Error in forecasting_agent: {e}")
        forecast = {"narrative": "Potential cluster instability if unresolved.", "trend": trend_block}
        trace_msg = "Forecasting Agent: LLM failed, fallback used"

    return {
        "forecast_narrative": forecast,
        "execution_trace": [trace_msg]
    }
