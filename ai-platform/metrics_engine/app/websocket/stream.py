from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
import asyncio
import traceback

from app.routes.pods import get_pod_summary
from agent_engine.graph import agent_graph

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

@router.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    print("WebSocket client connected to /ws/stream")
    metrics_history = []

    try:
        while True:
            try:
                # 1. Gather live telemetry payload
                summary_response = get_pod_summary()
                summary = summary_response.get("data", {})

                # 2. Maintain rolling metrics history for trend analysis
                metrics_history = (metrics_history + [summary])[-10:]

                initial_state = {
                    "metrics_summary": summary,
                    "metrics_history": metrics_history,
                    "anomalies": [],
                    "topology": {},
                    "correlations": {},
                    "root_cause_analysis": {},
                    "recommendations": [],
                    "forecast_narrative": {},
                    "execution_trace": []
                }

                # 3. Execute the Agent Graph — errors are caught per-cycle, not fatal
                print("Invoking Agent Graph...")
                try:
                    final_state = await run_in_threadpool(agent_graph.invoke, initial_state)
                    trace = final_state.get('execution_trace', [])
                    anomaly_count = len(final_state.get('anomalies', []))
                    print(f"Graph OK. Anomalies: {anomaly_count}. Trace: {trace}")
                except Exception as graph_err:
                    print(f"Graph Invoke Error (non-fatal): {graph_err}")
                    traceback.print_exc()
                    # Use raw metrics as fallback payload — DO NOT kill the WebSocket
                    final_state = {
                        **initial_state,
                        "execution_trace": [f"Graph Error: {str(graph_err)[:80]}"]
                    }

                # 4. Broadcast the final state to the frontend
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
