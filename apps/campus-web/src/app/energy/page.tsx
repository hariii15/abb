"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet, apiPost } from "@/lib/api";
import type { EnergyPoint } from "@/lib/types";

export default function EnergyPage() {
  const [points, setPoints] = useState<EnergyPoint[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiGet<{ items: EnergyPoint[] }>("/energy?hours=24");
      setPoints(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 10000);
    return () => clearInterval(id);
  }, [load]);

  async function tick() {
    setBusy(true);
    try {
      await apiPost("/energy/tick");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Tick failed");
    } finally {
      setBusy(false);
    }
  }

  const chartData = points.map((p) => ({
    ...p,
    t: new Date(p.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  }));

  const maxKw = Math.max(1, ...points.map((p) => p.kw));

  return (
    <main>
      <h1 className="page-title">Energy monitoring</h1>
      <p className="page-desc">
        Synthetic campus load curve; append samples to stress metrics pipelines
        during demos.
      </p>

      {err && (
        <p className="badge badge-bad" style={{ marginBottom: "1rem" }}>
          {err}
        </p>
      )}

      <div className="flex" style={{ marginBottom: "1rem" }}>
        <button type="button" className="btn btn-primary" onClick={() => void tick()} disabled={busy}>
          Add sample reading
        </button>
        <button type="button" className="btn" onClick={() => void load()} disabled={busy}>
          Refresh
        </button>
      </div>

      <div className="card chart-wrap">
        <h3>Electricity (last window)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="kwFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3ecf8e" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3ecf8e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3544" />
            <XAxis dataKey="t" tick={{ fill: "#8b9cb3", fontSize: 11 }} />
            <YAxis domain={[0, Math.ceil(maxKw * 1.1)]} tick={{ fill: "#8b9cb3", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#12181f", border: "1px solid #2a3544" }}
              labelStyle={{ color: "#e6edf3" }}
            />
            <Area type="monotone" dataKey="kw" stroke="#3ecf8e" fill="url(#kwFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>By building (latest)</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Building</th>
              <th>Latest kW</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {["Block A", "Block B", "Sports"].map((b) => {
              const last = [...points].reverse().find((p) => p.building === b);
              return (
                <tr key={b}>
                  <td>{b}</td>
                  <td>{last ? last.kw.toFixed(2) : "—"}</td>
                  <td className="muted">{last ? new Date(last.ts).toLocaleString() : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
