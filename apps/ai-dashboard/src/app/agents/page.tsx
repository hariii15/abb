"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import "../globals.css";

export default function AgentsDashboard() {
  const [wsStatus, setWsStatus] = useState<string>("CONNECTING");
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [rootCause, setRootCause] = useState<any>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stream");
    
    ws.onopen = () => setWsStatus("ONLINE");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "error") {
          setError(data.message);
          return;
        }
        if (data.type === "update") {
          setError(null);
          if (data.trace) setTrace(data.trace);
          if (data.anomalies) setAnomalies(data.anomalies);
          if (data.root_cause) setRootCause(data.root_cause);
          if (data.recommendations) setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("WebSocket error:", err);
      }
    };

    ws.onclose = () => setWsStatus("DISCONNECTED");
    return () => ws.close();
  }, []);

  const hasAnomaly = anomalies.length > 0;

  return (
    <div className="dashboard-root" style={{ minHeight: "100vh", padding: "40px", background: "#0a0f18", color: "white" }}>
      <header className="flex" style={{ justifyContent: "space-between", marginBottom: "40px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "10px" }}>Agent Intelligence Core</h1>
          <p style={{ color: "var(--muted)" }}>Live execution trace of the 3-Layer Reasoning Engine</p>
        </div>
        <div className="flex" style={{ gap: "20px" }}>
          {error && (
            <div className="glass-panel" style={{ color: "var(--danger)", padding: "10px 20px", fontSize: "0.8rem" }}>
              ⚠️ Engine Error: {error}
            </div>
          )}
          <Link href="/">
            <button className="glass-panel" style={{ padding: "10px 20px", cursor: "pointer", border: "1px solid var(--border)" }}>
              ← Back to Topology
            </button>
          </Link>
          <div className="flex muted" style={{ fontSize: "0.8rem", fontFamily: "monospace", padding: "10px 20px", background: "rgba(0,0,0,0.5)", borderRadius: "8px" }}>
            <div className="pulse" style={{ background: wsStatus === "ONLINE" ? "var(--accent)" : "var(--warn)" }}></div>
            ENGINE STATUS: {wsStatus}
          </div>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "30px" }}>
        
        {/* Layer 1 */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ color: "var(--accent)", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            LAYER 1: DETERMINISTIC
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["CPU", "Memory", "Network", "Storage"].map(agent => {
              const isActive = trace.some(t => t.toLowerCase().includes(agent.toLowerCase()));
              return (
                <li key={agent} style={{ 
                  padding: "15px", 
                  background: isActive ? "rgba(0, 255, 170, 0.1)" : "rgba(255,255,255,0.05)",
                  borderLeft: `4px solid ${isActive ? "var(--accent)" : "transparent"}`,
                  marginBottom: "10px",
                  borderRadius: "4px",
                  transition: "all 0.3s ease"
                }}>
                  {agent} Agent {isActive && "✓"}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Layer 2 */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ color: "#3b82f6", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            LAYER 2: INTELLIGENCE
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["Dependency", "Correlation"].map(agent => {
              const isActive = trace.some(t => t.toLowerCase().includes(agent.toLowerCase()));
              return (
                <li key={agent} style={{ 
                  padding: "15px", 
                  background: isActive ? "rgba(59, 130, 246, 0.1)" : "rgba(255,255,255,0.05)",
                  borderLeft: `4px solid ${isActive ? "#3b82f6" : "transparent"}`,
                  marginBottom: "10px",
                  borderRadius: "4px",
                  transition: "all 0.3s ease"
                }}>
                  {agent} Agent {isActive && "✓"}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Layer 3 */}
        <div className="glass-panel" style={{ padding: "20px", border: hasAnomaly ? "1px solid var(--danger)" : "1px solid var(--border)" }}>
          <h3 style={{ color: hasAnomaly ? "var(--danger)" : "var(--muted)", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            LAYER 3: LLM REASONING {hasAnomaly ? "(ACTIVE)" : "(BLOCKED)"}
          </h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {["Root Cause", "Recommendation", "Forecasting"].map(agent => {
              const isActive = trace.some(t => t.toLowerCase().includes(agent.toLowerCase()) && !t.includes("Skipped"));
              const isSkipped = trace.some(t => t.includes("Skipped") && t.toLowerCase().includes(agent.toLowerCase()));
              
              return (
                <li key={agent} style={{ 
                  padding: "15px", 
                  background: isActive ? "rgba(239, 68, 68, 0.1)" : "rgba(255,255,255,0.02)",
                  borderLeft: `4px solid ${isActive ? "var(--danger)" : "transparent"}`,
                  marginBottom: "10px",
                  borderRadius: "4px",
                  opacity: isSkipped ? 0.3 : 1,
                  transition: "all 0.3s ease"
                }}>
                  {agent} Agent {isActive && "💡"} {isSkipped && "(Skipped)"}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Live Agent Trace Log */}
      <div className="glass-panel" style={{ marginTop: "30px", padding: "20px", maxHeight: "200px", overflowY: "auto" }}>
        <h4 className="muted" style={{ fontSize: "0.7rem", textTransform: "uppercase", marginBottom: "15px" }}>Live Agent Execution Trace</h4>
        <div style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--accent)" }}>
          {trace.map((t, i) => (
            <div key={i} style={{ marginBottom: "5px" }}>
              <span style={{ color: "var(--muted)" }}>[{new Date().toLocaleTimeString()}]</span> {t}
            </div>
          )).reverse()}
        </div>
      </div>

      {hasAnomaly && (
        <div style={{ marginTop: "40px" }} className="glass-panel slide-up">
          <h2 style={{ color: "var(--danger)", marginBottom: "20px" }}>LLM Inference Results</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ background: "rgba(0,0,0,0.5)", padding: "20px", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--muted)", marginBottom: "10px" }}>Root Cause Analysis</h4>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
                {rootCause.explanation || "Analyzing..."}
              </p>
            </div>
            <div style={{ background: "rgba(0,0,0,0.5)", padding: "20px", borderRadius: "8px" }}>
              <h4 style={{ color: "var(--muted)", marginBottom: "10px" }}>AI Recommendation</h4>
              <p style={{ fontSize: "1.1rem", lineHeight: "1.6" }}>
                > {recommendations[0]?.action || "Calculating remediation..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
