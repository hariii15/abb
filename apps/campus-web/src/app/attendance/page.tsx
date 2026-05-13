"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import type { AttendanceLog } from "@/lib/types";

export default function AttendancePage() {
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("STU-10422");
  const [name, setName] = useState("A. Kumar");
  const [gate, setGate] = useState("North Gate");

  const load = useCallback(async () => {
    setErr(null);
    try {
      const res = await apiGet<{ items: AttendanceLog[] }>("/attendance/recent?limit=80");
      setLogs(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 8000);
    return () => clearInterval(id);
  }, [load]);

  async function seed() {
    setBusy(true);
    setErr(null);
    try {
      await apiPost("/seed");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Seed failed");
    } finally {
      setBusy(false);
    }
  }

  async function scan() {
    setBusy(true);
    setErr(null);
    try {
      await apiPost("/attendance/scan", { student_id: studentId, name, gate });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  const active = new Set(logs.map((l) => l.student_id)).size;

  return (
    <main>
      <h1 className="page-title">Student attendance</h1>
      <p className="page-desc">
        RFID simulation: each scan is recorded by the auth microservice (via the API gateway).
      </p>

      {err && (
        <p className="badge badge-bad" style={{ marginBottom: "1rem" }}>
          {err}
        </p>
      )}

      <div className="flex" style={{ marginBottom: "1rem" }}>
        <button type="button" className="btn" onClick={() => void seed()} disabled={busy}>
          Seed demo data
        </button>
        <button type="button" className="btn" onClick={() => void load()} disabled={busy}>
          Refresh
        </button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: "1rem" }}>
        <div className="card">
          <h3>Simulate scan</h3>
          <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.5rem" }}>
            <label className="muted">
              Student ID
              <input
                className="inp"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
            <label className="muted">
              Name
              <input
                className="inp"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
            <label className="muted">
              Gate
              <input
                className="inp"
                value={gate}
                onChange={(e) => setGate(e.target.value)}
                style={{ width: "100%", marginTop: "0.25rem" }}
              />
            </label>
            <button type="button" className="btn btn-primary" onClick={() => void scan()} disabled={busy}>
              Record scan
            </button>
          </div>
        </div>
        <div className="card">
          <h3>Active students (session)</h3>
          <div className="metric">{active}</div>
          <p className="muted" style={{ margin: "0.5rem 0 0" }}>
            Distinct student IDs in the recent log window.
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Live logs</h3>
        <ul className="log-list">
          {logs.map((l) => (
            <li key={l.id}>
              <strong>{l.scanned_at}</strong> — {l.name} ({l.student_id}) @ {l.gate}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
