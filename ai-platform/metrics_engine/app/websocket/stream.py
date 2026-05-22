from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
import asyncio
import traceback

from app.routes.pods import get_pod_summary
from agent_engine.graph import agent_graph
from agent_engine.agents.lower_agents import _detect_all_anomalies

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

manager = ConnectionManager()

def check_considerable_change(active_anomalies, last_anomalies, current_metrics, last_metrics_at_llm_run):
    """
    Checks if active anomalies or their metrics have changed considerably since the last LLM run.
    """
    # 1. Compare anomaly sets by (service, type)
    active_keys = {(a.get("service"), a.get("type")) for a in active_anomalies}
    last_keys = {(a.get("service"), a.get("type")) for a in last_anomalies}
    
    if active_keys != last_keys:
        return True  # Anomaly type or service changed!
        
    # 2. Check each active anomaly for considerable metric changes
    for anomaly in active_anomalies:
        pod = anomaly.get("service")
        atype = anomaly.get("type")
        if not pod or not atype:
            continue
            
        current_stats = current_metrics.get(pod, {})
        last_stats = last_metrics_at_llm_run.get(pod, {})
        
        if atype == "cpu_spike":
            curr_cpu = float(current_stats.get("cpu", 0))
            last_cpu = float(last_stats.get("cpu", 0))
            abs_diff = abs(curr_cpu - last_cpu)
            rel_diff = abs_diff / max(last_cpu, 1.0)
            if abs_diff > 50.0 and rel_diff > 0.10: # >50m absolute and >10% relative
                return True
                
        elif atype == "memory_leak":
            curr_mem = float(current_stats.get("memory", 0))
            last_mem = float(last_stats.get("memory", 0))
            abs_diff = abs(curr_mem - last_mem)
            rel_diff = abs_diff / max(last_mem, 1.0)
            if abs_diff > 50.0 and rel_diff > 0.10: # >50MB absolute and >10% relative
                return True
                
        elif atype == "storage_pressure":
            curr_sto = float(current_stats.get("storage", 0))
            last_sto = float(last_stats.get("storage", 0))
            if abs(curr_sto - last_sto) > 5.0: # >5% absolute change
                return True
                
        elif atype == "restart_storm":
            curr_rest = int(current_stats.get("restarts", 0))
            last_rest = int(last_stats.get("restarts", 0))
            if curr_rest != last_rest: # Any restart count change
                return True
                
    return False

@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print("WebSocket client connected to /ws/stream")
    metrics_history = []
    
    # Caching variables for LLM execution
    last_anomalies = []
    last_metrics_at_llm_run = {}
    cached_root_cause = {}
    cached_recommendations = []
    cached_forecasts = {}

    try:
        while True:
            try:
                # 1. Gather live telemetry payload asynchronously to avoid blocking the event loop
                summary_response = await run_in_threadpool(get_pod_summary)
                summary = summary_response.get("data", {})

                # 2. Maintain rolling metrics history for trend analysis
                metrics_history = (metrics_history + [summary])[-10:]

                # 3. Detect anomalies locally to determine if LLM is required
                active_anomalies = _detect_all_anomalies(summary)
                
                if not active_anomalies:
                    # Healthy state: skip LLM and clear cache
                    skip_llm = True
                    last_anomalies = []
                    last_metrics_at_llm_run = {}
                    cached_root_cause = {}
                    cached_recommendations = []
                    cached_forecasts = {}
                else:
                    # Anomalous state: check if LLM should run or be bypassed using cache
                    has_change = check_considerable_change(active_anomalies, last_anomalies, summary, last_metrics_at_llm_run)
                    if has_change or not cached_root_cause:
                        skip_llm = False
                    else:
                        skip_llm = True

                initial_state = {
                    "metrics_summary": summary,
                    "metrics_history": metrics_history,
                    "skip_llm": skip_llm,
                    "anomalies": [],
                    "topology": {},
                    "correlations": {},
                    "root_cause_analysis": {},
                    "recommendations": [],
                    "forecast_narrative": {},
                    "execution_trace": []
                }

                # 4. Execute the Agent Graph — errors are caught per-cycle, not fatal
                print(f"Invoking Agent Graph (skip_llm={skip_llm})...")
                try:
                    final_state = await run_in_threadpool(agent_graph.invoke, initial_state)
                    
                    if skip_llm and active_anomalies:
                        # Restore LLM fields from cache if skipped
                        final_state["root_cause_analysis"] = cached_root_cause
                        final_state["recommendations"] = cached_recommendations
                        final_state["forecast_narrative"] = cached_forecasts
                        final_state["execution_trace"] = final_state.get("execution_trace", []) + ["Reasoning Layer: Cached (Metrics stable)"]
                    elif not skip_llm and active_anomalies:
                        # LLM ran successfully: update the cache
                        cached_root_cause = final_state.get("root_cause_analysis", {})
                        cached_recommendations = final_state.get("recommendations", [])
                        cached_forecasts = final_state.get("forecast_narrative", {})
                        last_anomalies = active_anomalies
                        last_metrics_at_llm_run = dict(summary)

                    trace = final_state.get('execution_trace', [])
                    anomaly_count = len(final_state.get('anomalies', []))
                    print(f"Graph OK. Anomalies: {anomaly_count}. Skip LLM: {skip_llm}. Trace: {trace}")
                except Exception as graph_err:
                    print(f"Graph Invoke Error (non-fatal): {graph_err}")
                    traceback.print_exc()
                    # Use raw metrics as fallback payload — DO NOT kill the WebSocket
                    final_state = {
                        **initial_state,
                        "execution_trace": [f"Graph Error: {str(graph_err)[:80]}"]
                    }

                # 5. Broadcast the final state to the frontend
                payload = {
                    "type": "update",
                    "summary": final_state.get("metrics_summary"),
                    "anomalies": final_state.get("anomalies", []),
                    "topology": final_state.get("topology", {}),
                    "correlations": final_state.get("correlations", {}),
                    "root_cause": final_state.get("root_cause_analysis", {}),
                    "recommendations": final_state.get("recommendations", []),
                    "forecasts": final_state.get("forecast_narrative", {}),
                    "trace": final_state.get("execution_trace", [])
                }

                await websocket.send_json(payload)

            except WebSocketDisconnect:
                raise  # Let the outer handler clean up
            except Exception as cycle_err:
                # A non-disconnect error in a single cycle: log and continue
                print(f"WebSocket cycle error (non-fatal): {cycle_err}")
                try:
                    await websocket.send_json({"type": "error", "message": str(cycle_err)[:200]})
                except Exception:
                    raise WebSocketDisconnect()

            # Stream every 8 seconds
            await asyncio.sleep(8)

    except WebSocketDisconnect:
        print("WebSocket client disconnected cleanly")
    except Exception as e:
        print(f"WebSocket fatal error: {e}")
    finally:
        manager.disconnect(websocket)

