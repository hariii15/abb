import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { getFirestore, persistenceMode, plainDoc } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4030);
const app = express();
app.use(cors());
app.use(express.json());

/** @type {{ total: number; online: number }} */
let cameras = { total: 4, online: 4 };

/** @type {Map<string, { camera_id: string; label: string; created_at: string }>} */
let events = new Map();

function seedCctvMemory() {
  cameras = { total: 4, online: 4 };
  events = new Map();
  events.set("c1", {
    camera_id: "CAM-2",
    label: "motion",
    created_at: new Date(Date.now() - 20 * 60_000).toISOString(),
  });
}

function lastMotionFromMap() {
  const motion = [...events.values()]
    .filter((e) => e.label === "motion")
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  if (motion) return motion.created_at;
  const any = [...events.values()].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
  return any ? any.created_at : null;
}

seedCctvMemory();

app.get("/health", (_req, res) => {
  getFirestore();
  res.json({ status: "ok", service: "cctv-service", persistence: persistenceMode() });
});

app.post("/seed", async (_req, res) => {
  try {
    seedCctvMemory();
    const db = getFirestore();
    if (!db) {
      return res.json({ ok: true, service: "cctv-service", persistence: "memory", events: events.size });
    }
    const batch = db.batch();
    for (const [id, row] of events) {
      batch.set(db.collection("cctv_events").doc(id), { ...row });
    }
    await batch.commit();
    res.json({ ok: true, service: "cctv-service", persistence: "firestore", events: events.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/cctv/summary", async (_req, res) => {
  try {
    const db = getFirestore();
    if (!db) {
      return res.json({
        total: cameras.total,
        online: cameras.online,
        last_motion_at: lastMotionFromMap(),
      });
    }
    const snap = await db.collection("cctv_events").orderBy("created_at", "desc").limit(40).get();
    const rows = snap.docs.map((d) => plainDoc(d)).filter(Boolean);
    const motion = rows.find((r) => r.label === "motion");
    const last_motion_at = motion?.created_at ?? (rows[0]?.created_at ?? null);
    res.json({
      total: cameras.total,
      online: cameras.online,
      last_motion_at,
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/cctv/events", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 40));
  try {
    const db = getFirestore();
    if (!db) {
      const items = [...events.entries()]
        .map(([id, row]) => ({ id, ...row }))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
      return res.json({ items });
    }
    const snap = await db.collection("cctv_events").orderBy("created_at", "desc").limit(limit).get();
    const items = snap.docs.map((d) => plainDoc(d)).filter(Boolean);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/cctv/event", async (req, res) => {
  const { camera_id, label } = req.body || {};
  if (!camera_id) return res.status(400).json({ error: "camera_id required" });
  const id = uuid();
  const row = {
    camera_id: String(camera_id).slice(0, 64),
    label: String(label || "motion").slice(0, 64),
    created_at: new Date().toISOString(),
  };
  try {
    const db = getFirestore();
    if (!db) {
      events.set(id, row);
      return res.json({ id, ...row });
    }
    await db.collection("cctv_events").doc(id).set(row);
    res.json({ id, ...row });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  getFirestore();
  console.log(`cctv-service :${PORT} persistence=${persistenceMode()}`);
});
