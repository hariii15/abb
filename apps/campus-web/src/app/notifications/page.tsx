"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [title, setTitle] = useState("Maintenance window");
  const [body, setBody] = useState("HVAC calibration Block B tonight 22:00–23:00.");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiGet<{ items: NotificationItem[] }>("/notifications?limit=50");
      setItems(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 12000);
    return () => clearInterval(id);
  }, [load]);

  async function create() {
    setBusy(true);
    try {
      await apiPost("/notifications", {
        title,
        body,
        channel: "in_app",
      });
      setTitle("");
      setBody("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1 className="page-title">Notification center</h1>
      <p className="page-desc">
        Alerts, emails, and in-app notices stored in Firebase for the campus
        operator view.
      </p>

      {err && (
        <p className="badge badge-bad" style={{ marginBottom: "1rem" }}>
          {err}
        </p>
      )}

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h3>Compose</h3>
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
            <label className="muted">
              Title
              <input
                className="inp"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
            <label className="muted">
              Body
              <textarea
                className="inp"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                style={{ width: "100%", marginTop: "0.25rem", resize: "vertical" }}
              />
            </label>
            <button type="button" className="btn btn-primary" onClick={() => void create()} disabled={busy}>
              Send in-app notification
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Inbox</h3>
          <p className="muted" style={{ marginTop: "0.5rem" }}>
            {items.filter((i) => !i.read).length} unread of {items.length}
          </p>
          <button type="button" className="btn" style={{ marginTop: "0.5rem" }} onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Feed</h3>
        <ul className="log-list" style={{ maxHeight: 480 }}>
          {items.map((n) => (
            <li key={n.id}>
              <span className="badge badge-ok">{n.channel}</span>{" "}
              <strong>{n.title}</strong>
              <div>{n.body}</div>
              <div className="muted">{new Date(n.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
