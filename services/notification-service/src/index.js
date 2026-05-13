import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { getFirestore, persistenceMode, plainDoc } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4040);
const app = express();
app.use(cors());
app.use(express.json());

/** @type {Map<string, { title: string; body: string; channel: string; read: boolean; created_at: string }>} */
let notifications = new Map();

function seedNotificationsMemory() {
  notifications = new Map();
  notifications.set("n1", {
    title: "Campus network maintenance",
    body: "Core switch firmware — expect brief Wi-Fi blips.",
    channel: "in_app",
    read: false,
    created_at: new Date(Date.now() - 60 * 60_000).toISOString(),
  });
}

seedNotificationsMemory();

app.get("/health", (_req, res) => {
  getFirestore();
  res.json({ status: "ok", service: "notification-service", persistence: persistenceMode() });
});

app.post("/seed", async (_req, res) => {
  try {
    seedNotificationsMemory();
    const db = getFirestore();
    if (!db) {
      return res.json({
        ok: true,
        service: "notification-service",
        persistence: "memory",
        notifications: notifications.size,
      });
    }
    const batch = db.batch();
    for (const [id, row] of notifications) {
      batch.set(db.collection("notifications").doc(id), { ...row });
    }
    await batch.commit();
    res.json({
      ok: true,
      service: "notification-service",
      persistence: "firestore",
      notifications: notifications.size,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/notifications", async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 40));
  try {
    const db = getFirestore();
    if (!db) {
      const items = [...notifications.entries()]
        .map(([id, row]) => ({ id, ...row }))
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, limit);
      return res.json({ items });
    }
    const snap = await db.collection("notifications").orderBy("created_at", "desc").limit(limit).get();
    const items = snap.docs.map((d) => plainDoc(d)).filter(Boolean);
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/notifications", async (req, res) => {
  const { title, body, channel } = req.body || {};
  if (!title || !body) return res.status(400).json({ error: "title and body required" });
  const id = uuid();
  const row = {
    title: String(title).slice(0, 160),
    body: String(body).slice(0, 4000),
    channel: String(channel || "in_app").slice(0, 32),
    read: false,
    created_at: new Date().toISOString(),
  };
  try {
    const db = getFirestore();
    if (!db) {
      notifications.set(id, row);
      return res.json({ id, ...row });
    }
    await db.collection("notifications").doc(id).set(row);
    res.json({ id, ...row });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  getFirestore();
  console.log(`notification-service :${PORT} persistence=${persistenceMode()}`);
});
