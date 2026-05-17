"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import Link from "next/link";
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  Brain, 
  TrendingUp, 
  CheckCircle,
  Clock,
  Shield,
  Layers,
  Terminal,
  Server,
  Network,
  RefreshCw,
  HardDrive,
  Wifi,
  Database
} from "lucide-react";

function normalizePodName(name: string): string {
  // auth-service-77ffc9d5c4-9wc4v → auth-service
  return name.replace(/-[a-z0-9]{8,10}-[a-z0-9]{5}$/, '');
}
import { aiGet } from "@/lib/ai-api";
import { MetricCharts } from "@/components/MetricCharts";

// Types
interface Anomaly {
  service: string;
  type: string;
  severity: string;
  description: string;
  timestamp: string;
  details: any;
}

interface Recommendation {
  service: string;
  action: string;
  explanation: string;
  patch: any;
}

interface Forecast {
  service: string;
  resource: string;
  current_value: number;
  forecast: {
    predicted_value: number;
    trend: string;
    timestamp: string;
  };
}

export default function AIDashboard() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [podStats, setPodStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [rootCause, setRootCause] = useState<any>(null);
  const [wsStatus, setWsStatus] = useState<string>("CONNECTING");
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Initial fetch to paint the screen immediately
    const fetchInitial = async () => {
      try {
        const [depData, anomalyData, recData, forecastData, summaryData] = await Promise.all([
          aiGet<any>("/dependencies"),
          aiGet<any>("/anomalies"),
          aiGet<any>("/recommendations"),
          aiGet<any>("/forecasts"),
          aiGet<any>("/pods/summary")
        ]);

        if (depData.status === "success") {
          setNodes(depData.data.nodes.map((n: any) => ({
            ...n,
            style: { 
              background: n.data.status === 'critical' ? 'var(--danger)' : '#1a222d', 
              color: "#fff", 
              border: `1px solid ${n.data.status === 'critical' ? 'var(--danger)' : 'var(--border)'}`,
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: "600",
              padding: "15px",
              width: 160,
              textAlign: 'center',
              boxShadow: n.data.status === 'critical' ? '0 0 20px var(--danger)' : 'none',
            },
            data: {
              ...n.data,
              label: (
                <div>
                  <div style={{ marginBottom: '5px' }}>{n.data.label}</div>
                  <div style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 'normal' }}>
                    {n.data.cpu} Usage
                  </div>
                </div>
              )
            }
          })));
          setEdges(depData.data.edges.map((e: any) => ({
            ...e,
            animated: true,
            labelStyle: { fill: 'var(--muted)', fontSize: '10px', fontWeight: 'bold' },
            style: { stroke: 'var(--accent)', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--accent)' }
          })));
        }

        setAnomalies(anomalyData.data || []);
        setRecommendations(recData.data || []);
        setForecasts(forecastData.data || []);
        
        if (summaryData.status === "success") {
          setPodStats(summaryData.data);
          const totalCpu = Object.values(summaryData.data).reduce((acc: number, curr: any) => acc + (curr.cpu || 0), 0);
          setMetrics(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString().split(' ')[0], value: parseFloat(totalCpu.toFixed(2)) }]);
        }
        setLoading(false);
      } catch (e) {
        console.error("Initial fetch failed", e);
      }
    };
    
    fetchInitial();

    // Auto-reconnecting WebSocket
    const connect = () => {
      const ws = new WebSocket("ws://localhost:8000/ws/stream");
      wsRef.current = ws;
      setWsStatus("CONNECTING");

      ws.onopen = () => setWsStatus("ONLINE");

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "update") return;

          if (data.topology?.nodes) {
            setNodes(data.topology.nodes.map((n: any) => ({
              ...n,
              style: {
                background: n.data.status === 'critical' ? 'var(--danger)' : (n.data.status === 'warning' ? 'rgba(255,170,0,0.1)' : '#1a222d'),
                color: "#fff",
                border: `1px solid ${n.data.status === 'critical' ? 'var(--danger)' : (n.data.status === 'warning' ? 'var(--warn)' : 'var(--border)')}`,
                borderRadius: "10px", fontSize: "11px", fontWeight: "600",
                padding: "15px", width: 160, textAlign: 'center',
                boxShadow: n.data.status === 'critical' ? '0 0 20px var(--danger)' : (n.data.status === 'warning' ? '0 0 15px var(--warn)' : 'none'),
              },
              data: {
                ...n.data,
                label: (
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    <div style={{ marginBottom: '5px', fontSize: '12px', letterSpacing: '1px' }}>{n.data.label.split('\n')[0]}</div>
                    <div style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 'bold' }}>{n.data.label.split('\n')[1] || "0m | 0MB"}</div>
                    {n.data.status === 'warning' && <div style={{ fontSize: '9px', color: 'var(--warn)', marginTop: '5px' }}>⚠️ DEP RISK</div>}
                  </div>
                )
              }
            })));
            setEdges(data.topology.edges.map((e: any) => ({
              ...e,
              animated: e.animated,
              labelStyle: { fill: 'var(--muted)', fontSize: '10px', fontWeight: 'bold' },
              style: { stroke: e.animated ? 'var(--warn)' : 'var(--accent)', strokeWidth: e.animated ? 3 : 2 },
              markerEnd: { type: MarkerType.ArrowClosed, color: e.animated ? 'var(--warn)' : 'var(--accent)' }
            })));
          }

          if (data.anomalies) setAnomalies(data.anomalies);
          if (data.forecasts) setForecasts(data.forecasts);
          if (data.root_cause) setRootCause(data.root_cause);
          if (data.recommendations && data.recommendations.length > 0) setRecommendations(data.recommendations);
          if (data.summary) {
            setPodStats(data.summary);
            const totalCpu = Object.values(data.summary).reduce((acc: number, curr: any) => acc + (curr.cpu || 0), 0);
            setMetrics(prev => [...prev.slice(-19), { time: new Date().toLocaleTimeString().split(' ')[0], value: parseFloat(totalCpu.toFixed(2)) }]);
          }
        } catch (err) {
          console.error("WebSocket payload error:", err);
        }
      };

      ws.onclose = () => {
        setWsStatus("DISCONNECTED");
        // Auto-reconnect after 5 seconds
        reconnectTimer.current = setTimeout(() => {
          console.log("Reconnecting WebSocket...");
          connect();
        }, 5000);
      };

      ws.onerror = () => ws.close();
    };

    connect();

    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [setNodes, setEdges]);

  return (
    <div className="dashboard-root">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="flex">
          <div className="brand">KUBEMIND <span>CORE</span></div>
        </div>
        <div className="flex" style={{ gap: '20px' }}>
          <Link href="/agents">
            <button className="glass-panel" style={{ padding: "8px 16px", cursor: "pointer", border: "1px solid var(--accent)", color: "var(--accent)" }}>
              👁️ View Agent Flow
            </button>
          </Link>
          <div className="flex muted" style={{ fontSize: "0.8rem", fontFamily: "monospace" }}>
            <div className="pulse" style={{ background: wsStatus === "ONLINE" ? "var(--accent)" : "var(--warn)" }}></div>
            ENGINE STATUS: {wsStatus}
          </div>
        </div>
      </header>

      <main>
        <div className="grid grid-12">
          {/* Left Column: Topology & Charts */}
          <div className="col-8">
            <div className="graph-wrap">
              <div style={{ position: "absolute", top: 15, left: 20, zIndex: 10 }}>
                <h3 className="muted" style={{ fontSize: "0.65rem", margin: 0 }}>Cluster Topology</h3>
              </div>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
              >
                <Background color="#1a222d" gap={30} size={1} />
                <Controls />
                <MiniMap 
                  nodeColor="#1a222d" 
                  maskColor="rgba(0,0,0,0.8)" 
                />
              </ReactFlow>
            </div>

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "1.5rem" }}>
              <MetricCharts 
                data={metrics} 
                title="Global CPU Demand" 
                color="var(--accent)" 
              />
              <div className="card">
                <h3>Predictive Confidence</h3>
                <div className="metric">99.98<span style={{ color: "var(--accent)", fontSize: "1.5rem" }}>%</span></div>
                <p className="muted">Autonomous Stability Score</p>
                <div style={{ height: "4px", width: "100%", background: "var(--border)", borderRadius: "4px", marginTop: "1rem" }}>
                  <div style={{ height: "100%", width: "99%", background: "var(--accent)", borderRadius: "4px" }}></div>
                </div>
              </div>
            </div>

            {/* Service Resources Section */}
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <div className="flex" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0 }}>Full Telemetry Explorer</h3>
                <span className="muted" style={{ fontSize: "0.7rem" }}>{Object.keys(podStats).length} Active Pods</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                    <th style={{ padding: "0.6rem", color: "var(--muted)" }}>Service</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "right" }}><Activity size={11}/> CPU</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "right" }}><Server size={11}/> MEM</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "right" }}><RefreshCw size={11}/> ↺</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "right" }}><Wifi size={11}/> NET</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "right" }}><Database size={11}/> STO</th>
                    <th style={{ padding: "0.6rem", color: "var(--muted)", textAlign: "center" }}>●</th>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td colSpan={7} style={{ padding: "0.2rem 0.6rem", fontSize: "0.65rem", color: "var(--muted)" }}>
                      CPU=Prometheus ✅&nbsp;&nbsp;MEM=Prometheus ✅&nbsp;&nbsp;↺=Prometheus(5m) ✅&nbsp;&nbsp;NET=Derived 🟡&nbsp;&nbsp;STO=FS/Baseline 🟡
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(podStats).map(([pod, stats]: [string, any], i) => {
                    const displayName = normalizePodName(pod);
                    const isCritical = stats.cpu > 500 || stats.restarts > 2 || stats.memory > 500;
                    const netKb = ((stats.network?.rx || 0) + (stats.network?.tx || 0)).toFixed(1);
                    const sto = stats.storage ? `${stats.storage.toFixed(0)}%` : '—';
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", background: isCritical ? 'rgba(255,50,50,0.04)' : 'transparent' }}>
                        <td style={{ padding: "0.6rem", fontWeight: "600", fontFamily: "monospace", color: "var(--accent)" }}>{displayName}</td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontFamily: "monospace" }}>
                          <span style={{ color: stats.cpu > 500 ? "var(--danger)" : "inherit" }}>{stats.cpu?.toFixed(1) || 0}m</span>
                        </td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontFamily: "monospace" }}>
                          <span style={{ color: stats.memory > 500 ? "var(--danger)" : "inherit" }}>{stats.memory?.toFixed(0) || 0}MB</span>
                        </td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontFamily: "monospace" }}>
                          <span style={{ color: stats.restarts > 2 ? "var(--warn)" : "inherit" }}>{stats.restarts || 0}</span>
                        </td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontFamily: "monospace", color: "var(--muted)" }}>{netKb} KB/s</td>
                        <td style={{ padding: "0.6rem", textAlign: "right", fontFamily: "monospace", color: "var(--muted)" }}>{sto}</td>
                        <td style={{ padding: "0.6rem", textAlign: "center" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isCritical ? "var(--danger)" : "var(--accent)", margin: "0 auto", boxShadow: isCritical ? "0 0 8px var(--danger)" : "none" }} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: AI Intelligence Feed */}
          <div className="col-4">
            <div className="card" style={{ height: "100%", minHeight: "800px", overflowY: "auto" }}>
              <div className="flex" style={{ marginBottom: "2rem" }}>
                <Brain size={20} style={{ color: "var(--accent)" }} />
                <h2 style={{ margin: 0, fontSize: "1rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Intelligence Feed</h2>
              </div>

              {/* Anomalies Section */}
              <section style={{ marginBottom: "2rem" }}>
                <div className="flex" style={{ justifyContent: "space-between", marginBottom: "1rem" }}>
                  <h4 className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase" }}>Active Anomalies</h4>
                  <span className="badge badge-bad">{anomalies.length}</span>
                </div>
                {anomalies.length === 0 && (
                  <div className="muted" style={{ textAlign: "center", padding: "2rem", border: "1px dashed var(--border)", borderRadius: "10px" }}>
                    No outliers detected
                  </div>
                )}
                {anomalies.map((a, i) => (
                  <div key={i} className={`insight-card ${a.severity} card`}>
                    <div className="flex" style={{ justifyContent: "space-between" }}>
                      <strong>{a.service}</strong>
                      <span className={`badge badge-${a.severity === 'critical' ? 'bad' : 'warn'}`}>{a.severity}</span>
                    </div>
                    <p style={{ fontSize: "0.85rem", margin: "0.75rem 0", color: "var(--muted)" }}>{a.description}</p>
                    <div className="muted flex">
                      <Clock size={12} /> {new Date(a.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </section>

              {/* Root Cause Section - only shown when LLM has reasoned */}
              {rootCause?.explanation && (
                <section style={{ marginBottom: "2rem" }}>
                  <h4 className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "1rem" }}>🧠 LLM Root Cause</h4>
                  <div className="card" style={{ border: "1px solid var(--danger)", background: "rgba(255,50,50,0.05)" }}>
                    <p style={{ fontSize: "0.85rem", margin: 0, lineHeight: 1.6 }}>{rootCause.explanation}</p>
                    {rootCause.evidence && (
                      <pre style={{ marginTop: "0.75rem", fontSize: "0.7rem", color: "var(--muted)", whiteSpace: "pre-wrap", fontFamily: "monospace", background: "var(--bg)", padding: "0.5rem", borderRadius: "6px" }}>{rootCause.evidence}</pre>
                    )}
                  </div>
                </section>
              )}

              {/* Recommendations Section */}
              <section style={{ marginBottom: "2rem" }}>
                <h4 className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "1rem" }}>AI Recommendations</h4>
                {Array.isArray(recommendations) && recommendations.map((r, i) => (
                  <div key={i} className="card" style={{ marginBottom: "1rem", border: "1px solid var(--info)" }}>
                    <div className="flex" style={{ marginBottom: "0.5rem" }}>
                      <Zap size={16} style={{ color: "var(--info)" }} />
                      <strong style={{ color: "var(--info)", fontFamily: "monospace", fontSize: "0.8rem" }}>{r.action}</strong>
                    </div>
                    {r.explanation && <div className="explanation" style={{ fontSize: "0.8rem" }}>{r.explanation}</div>}
                    <button className="btn btn-primary" style={{ marginTop: "0.5rem", fontSize: "0.75rem" }}>Deploy Autonomous Patch</button>
                  </div>
                ))}
              </section>

              {/* Forecasts Section */}
              <section>
                <h4 className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "1rem" }}>Strategic Forecasts</h4>
                {Array.isArray(forecasts) && forecasts.map((f, i) => (
                  <div key={i} className="flex card" style={{ marginBottom: "0.75rem", justifyContent: "space-between" }}>
                    <div className="flex">
                      <TrendingUp size={14} style={{ color: "var(--accent)" }} />
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold" }}>{f.service}</span>
                    </div>
                    <span className="badge badge-ok">{f.forecast.trend}</span>
                  </div>
                ))}
                {/* Display Narrative if present */}
                {!Array.isArray(forecasts) && forecasts && (forecasts as any).narrative && (
                  <div className="card" style={{ fontSize: "0.85rem", fontStyle: "italic", color: "var(--muted)" }}>
                    { (forecasts as any).narrative }
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
