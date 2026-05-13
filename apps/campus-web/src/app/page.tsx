"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { OverviewResponse } from "@/lib/types";

export default function HomePage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiGet<OverviewResponse>("/overview");
      setData(res);
    } catch (e) {
      setData(null);
      setErr(e instanceof Error ? e.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  if (err || !data) {
    return (
      <main>
        <h1 className="page-title">Campus overview</h1>
        <p className="page-desc">
          Start the API gateway and microservices, then retry.{" "}
          {err && <span className="muted">{err}</span>}
        </p>
        <div className="card">
          <p className="muted" style={{ margin: 0 }}>
            From repo root: <code>npm run dev:campus</code> (gateway on :4000, services on :4010–:4050).
          </p>
        </div>
        <p className="muted" style={{ marginTop: "1rem" }}>
          <button type="button" className="btn" onClick={() => void load()}>
            Retry
          </button>
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1 className="page-title">Campus overview</h1>
      <p className="page-desc">
        Data via <strong>API gateway</strong> (aggregates storage, CCTV, energy). Storage:{" "}
        <strong>{data.storage_mode}</strong>
        <button type="button" className="btn" style={{ marginLeft: "0.75rem" }} onClick={() => void load()}>
          Refresh
        </button>
      </p>

      <div className="grid grid-2" style={{ marginBottom: "1.25rem" }}>
        <div className="card">
          <h3>Active devices</h3>
          <div className="metric">{data.totals.active_devices}</div>
          <span className="muted">of {data.totals.devices} registered</span>
        </div>
        <div className="card">
          <h3>Open alerts</h3>
          <div className="metric">{data.totals.open_alerts}</div>
        </div>
        <div className="card">
          <h3>Avg room temp</h3>
          <div className="metric">{data.totals.avg_temp_c.toFixed(1)}°C</div>
        </div>
        <div className="card">
          <h3>Est. power now</h3>
          <div className="metric">{data.totals.estimated_kw.toFixed(1)} kW</div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h3>Rooms</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Building</th>
                <th>Occupancy</th>
                <th>Temp</th>
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((r) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.building}</td>
                  <td>{r.occupancy}</td>
                  <td>{r.temp_c.toFixed(1)}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3>Recent alerts</h3>
          <ul className="log-list">
            {data.recent_alerts.length === 0 && (
              <li className="muted">No alerts</li>
            )}
            {data.recent_alerts.map((a) => (
              <li key={a.id}>
                <span
                  className={`badge badge-${a.severity === "critical" ? "bad" : a.severity === "warning" ? "warn" : "ok"}`}
                >
                  {a.severity}
                </span>{" "}
                <strong>{a.message}</strong>
                <div className="muted">{new Date(a.created_at).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h3>CCTV summary</h3>
        <p style={{ margin: 0 }} className="muted">
          {data.cctv.online} online / {data.cctv.total} cameras · Last motion:{" "}
          {data.cctv.last_motion_at
            ? new Date(data.cctv.last_motion_at).toLocaleString()
            : "—"}
        </p>
      </div>
    </main>
  );
}
