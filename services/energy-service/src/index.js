import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { getFirestore, persistenceMode, plainDoc } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4020);
const app = express();
app.use(cors());
app.use(express.json());

/** @type {Map<string, { ts: string; building: string; kw: number }>} */
let readings = new Map();

function randomKw(building) {
  const base = { "Block A": 42, "Block B": 36, Sports: 28 }[building] ?? 30;
  return Math.round((base + (Math.random() * 10 - 3)) * 100) / 100;
}

function seedEnergyMemory() {
  readings = new Map();
  const now = Date.now();
  const buildings = ["Block A", "Block B", "Sports"];
  for (let h = 24; h > 0; h -= 1) {
    const ts = new Date(now - h * 60 * 60 * 1000).toISOString();
    for (const building of buildings) {
      const id = uuid();
      readings.set(id, { ts, building, kw: randomKw(building) });
    }
  }
}

function summaryFromMap() {
  const sorted = [...readings.values()].sort((a, b) => (a.ts < b.ts ? -1 : 1));
  const tail = sorted.slice(-30);
  const estimated_kw =
    tail.length === 0 ? 0 : Math.round((tail.reduce((s, r) => s + r.kw, 0) / tail.length) * 100) / 100;
  return { estimated_kw };
}

seedEnergyMemory();

app.get("/health", (_req, res) => {
  getFirestore();
  res.json({ status: "ok", service: "energy-service", persistence: persistenceMode() });
});

app.post("/seed", async (_req, res) => {
  try {
    seedEnergyMemory();
    const db = getFirestore();
    if (!db) {
      return res.json({ ok: true, service: "energy-service", persistence: "memory", readings: readings.size });
    }
    let batch = db.batch();
    let n = 0;
    const flush = async () => {
      if (n === 0) return;
      await batch.commit();
      batch = db.batch();
      n = 0;
    };
    for (const [id, row] of readings) {
      batch.set(db.collection("energy_readings").doc(id), { ...row });
      n += 1;
      if (n >= 400) await flush();
    }
    await flush();
    res.json({ ok: true, service: "energy-service", persistence: "firestore", readings: readings.size });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/energy/summary", async (_req, res) => {
  try {
    const db = getFirestore();
    if (!db) return res.json(summaryFromMap());
    const snap = await db.collection("energy_readings").orderBy("ts", "desc").limit(120).get();
    const rows = snap.docs.map((d) => plainDoc(d)).filter(Boolean);
    const tail = rows.slice(0, 30);
    const estimated_kw =
      tail.length === 0 ? 0 : Math.round((tail.reduce((s, r) => s + Number(r.kw), 0) / tail.length) * 100) / 100;
    res.json({ estimated_kw });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get("/energy", async (req, res) => {
  const hours = Math.min(168, Math.max(1, Number(req.query.hours) || 24));
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  try {
    const db = getFirestore();
    if (!db) {
      const items = [...readings.entries()]
        .map(([id, row]) => ({ id, ...row }))
        .filter((r) => new Date(r.ts).getTime() >= cutoff)
        .sort((a, b) => (a.ts < b.ts ? -1 : 1));
      return res.json({ items });
    }
    const snap = await db.collection("energy_readings").orderBy("ts", "desc").limit(800).get();
    const items = snap.docs
      .map((d) => plainDoc(d))
      .filter(Boolean)
      .filter((r) => new Date(r.ts).getTime() >= cutoff)
      .sort((a, b) => (a.ts < b.ts ? -1 : 1));
    res.json({ items });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/energy/tick", async (_req, res) => {
  const building = ["Block A", "Block B", "Sports"][Math.floor(Math.random() * 3)];
  const id = uuid();
  const row = {
    ts: new Date().toISOString(),
    building,
    kw: randomKw(building),
  };
  try {
    const db = getFirestore();
    if (!db) {
      readings.set(id, row);
      return res.json({ id, ...row });
    }
    await db.collection("energy_readings").doc(id).set(row);
    res.json({ id, ...row });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  getFirestore();
  console.log(`energy-service :${PORT} persistence=${persistenceMode()}`);
});
