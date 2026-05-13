import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { getFirestore, persistenceMode, plainDoc } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4010);
const app = express();
app.use(cors());
app.use(express.json());

/** @type {Map<string, { student_id: string; name: string; gate: string; scanned_at: string }>} */
let attendance = new Map();

function seedAttendanceMemory() {
  attendance = new Map();
  const now = new Date();
  const mk = (id, student_id, name, gate, mins) => {
    const t = new Date(now.getTime() - mins * 60_000).toISOString();
    attendance.set(id, { student_id, name, gate, scanned_at: t });
  };
  mk("l1", "STU-10001", "R. Patel", "North Gate", 3);
  mk("l2", "STU-10088", "S. Lee", "East Gate", 7);
}

function recentMemory(limit) {
  return [...attendance.entries()]
    .map(([id, row]) => ({ id, ...row }))
    .sort((a, b) => (a.scanned_at < b.scanned_at ? 1 : -1))
    .slice(0, limit);
}

seedAttendanceMemory();

app.get("/health", (_req, res) => {
  getFirestore();
  res.json({ status: "ok", service: "auth-service", persistence: persistenceMode() });
});

app.post("/seed", async (_req, res) => {
  try {
    seedAttendanceMemory();
    const db = getFirestore();
    if (!db) {
      return res.json({ ok: true, service: "auth-service", persistence: "memory", attendance: attendance.size });
    }
    const batch = db.batch();
    for (const [id, row] of attendance) {
      batch.set(db.collection("attendance_logs").doc(id), { ...row });
    }
    await batch.commit();
    res.json({ ok: true, service: "auth-service", persistence: "firestore", attendance: attendance.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/attendance/recent", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
  try {
    const db = getFirestore();
    if (!db) return res.json({ items: recentMemory(limit) });
    const snap = await db.collection("attendance_logs").orderBy("scanned_at", "desc").limit(limit).get();
    const items = snap.docs.map((d) => plainDoc(d)).filter(Boolean);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/attendance/scan", async (req, res) => {
  const { student_id, name, gate } = req.body || {};
  if (!student_id || !name) {
    return res.status(400).json({ error: "student_id and name required" });
  }
  const id = uuid();
  const row = {
    student_id: String(student_id).slice(0, 64),
    name: String(name).slice(0, 120),
    gate: String(gate || "North Gate").slice(0, 120),
    scanned_at: new Date().toISOString(),
  };
  try {
    const db = getFirestore();
    if (!db) {
      attendance.set(id, row);
      return res.json({ id, ...row });
    }
    await db.collection("attendance_logs").doc(id).set(row);
    res.json({ id, ...row });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  getFirestore();
  console.log(`auth-service :${PORT} persistence=${persistenceMode()}`);
});
