"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { CctvEvent } from "@/lib/types";

export default function CctvPage() {
  const [events, setEvents] = useState<CctvEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiGet<{ items: CctvEvent[] }>("/cctv/events?limit=60");
      setEvents(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 6000);
    return () => clearInterval(id);
  }, [load]);

  async function simulate() {
    setBusy(true);
    try {
      await apiPost("/cctv/event", {
        camera_id: `CAM-${Math.floor(Math.random() * 5) + 1}`,
        label: ["motion", "perimeter", "crowd"][Math.floor(Math.random() * 3)],
      });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Simulate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1 className="page-title">CCTV analytics</h1>
      <p className="page-desc">
        Simulated streams and detection events. Generating events produces log and
        metric-friendly activity for downstream observability.
      </p>

      {err && (
        <p className="badge badge-bad" style={{ marginBottom: "1rem" }}>
          {err}
        </p>
      )}

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="card">
            <h3>Camera {n}</h3>
            <div
              style={{
                height: 120,
                borderRadius: 8,
                background: `linear-gradient(135deg, #1a222d 0%, #0d3d2d 50%, #12181f 100%)`,
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: "0.85rem",
              }}
            >
              Simulated feed · idle
            </div>
            <p className="muted" style={{ margin: "0.5rem 0 0" }}>
              CAM-{n} · 1080p
            </p>
          </div>
        ))}
      </div>

      <div className="flex" style={{ marginBottom: "1rem" }}>
        <button type="button" className="btn btn-primary" onClick={() => void simulate()} disabled={busy}>
          Simulate motion event
        </button>
        <button type="button" className="btn" onClick={() => void load()} disabled={busy}>
          Refresh
        </button>
      </div>

      <div className="card">
        <h3>Motion & analytics events</h3>
        <ul className="log-list">
          {events.map((e) => (
            <li key={e.id}>
              <strong>{e.label}</strong> — {e.camera_id} ·{" "}
              {new Date(e.created_at).toLocaleString()}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
