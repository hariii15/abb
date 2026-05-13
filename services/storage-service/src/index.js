import cors from "cors";
import express from "express";
import { v4 as uuid } from "uuid";
import { getFirestore, persistenceMode, plainDoc } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4050);
const app = express();
app.use(cors());
app.use(express.json());

/** @type {Map<string, any>} */
let rooms = new Map();
/** @type {Map<string, any>} */
let devices = new Map();
/** @type {Map<string, any>} */
let alerts = new Map();

function seedCampusMemory() {
  rooms = new Map([
    ["r101", { name: "101", building: "Block A", occupancy: 32, temp_c: 22.4 }],
    ["r102", { name: "102", building: "Block A", occupancy: 28, temp_c: 23.1 }],
    ["r201", { name: "Lab 2", building: "Block B", occupancy: 18, temp_c: 21.8 }],
    ["r202", { name: "Seminar Hall", building: "Block B", occupancy: 54, temp_c: 22.9 }],
    ["r-gym", { name: "Sports Hall", building: "Sports", occupancy: 12, temp_c: 24.2 }],
    ["r-lib", { name: "Reading Room", building: "Library", occupancy: 41, temp_c: 21.2 }],
  ]);
  devices = new Map([
    ["d1", { type: "sensor", room_id: "r101", status: "online" }],
    ["d2", { type: "hvac", room_id: "r101", status: "online" }],
    ["d3", { type: "sensor", room_id: "r102", status: "online" }],
    ["d4", { type: "cctv", room_id: "r201", status: "online" }],
    ["d5", { type: "cctv", room_id: "r202", status: "online" }],
    ["d6", { type: "access", room_id: "r-gym", status: "offline" }],
    ["d7", { type: "sensor", room_id: "r-lib", status: "online" }],
    ["d8", { type: "cctv", room_id: "r-lib", status: "online" }],
  ]);
  const now = Date.now();
  alerts = new Map([
    [
      "a1",
      {
        severity: "warning",
        message: "North gate reader latency elevated",
        created_at: new Date(now - 12 * 60_000).toISOString(),
        open: true,
      },
    ],
    [
      "a2",
      {
        severity: "info",
        message: "Scheduled generator test completed",
        created_at: new Date(now - 2 * 60 * 60_000).toISOString(),
        open: false,
      },
    ],
    [
      "a3",
      {
        severity: "critical",
        message: "UPS self-test failed — verify battery string B",
        created_at: new Date(now - 6 * 60 * 60_000).toISOString(),
        open: true,
      },
    ],
  ]);
}

function campusStateMemory() {
  const roomRows = [...rooms.entries()].map(([id, r]) => ({ id, ...r }));
  const deviceRows = [...devices.values()];
  const active = deviceRows.filter((d) => d.status === "online").length;
  const openAlerts = [...alerts.values()].filter((a) => a.open);
  const temps = roomRows.map((r) => r.temp_c);
  const avg_temp_c = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 100) / 100 : 0;
  const recent_alerts = [...alerts.entries()]
    .map(([id, a]) => ({ id, ...a }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);
  return {
    storage_mode: "memory",
    rooms: roomRows,
    recent_alerts,
    totals: {
      devices: deviceRows.length,
      active_devices: active,
      open_alerts: openAlerts.length,
      avg_temp_c,
    },
  };
}

async function campusStateFirestore(db) {
  const [roomSnaps, deviceSnaps, alertSnaps] = await Promise.all([
    db.collection("rooms").get(),
    db.collection("devices").get(),
    db.collection("alerts").get(),
  ]);
  const roomRows = roomSnaps.docs.map((d) => plainDoc(d)).filter(Boolean);
  const deviceRows = deviceSnaps.docs.map((d) => d.data()).filter(Boolean);
  const active = deviceRows.filter((d) => d.status === "online").length;
  const allAlerts = alertSnaps.docs.map((d) => plainDoc(d)).filter(Boolean);
  const openAlerts = allAlerts.filter((a) => a.open);
  const temps = roomRows.map((r) => r.temp_c);
  const avg_temp_c = temps.length ? Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 100) / 100 : 0;
  const recent_alerts = allAlerts.sort((a, b) => (a.created_at < b.created_at ? 1 : -1)).slice(0, 8);
  return {
    storage_mode: "firestore",
    rooms: roomRows,
    recent_alerts,
    totals: {
      devices: deviceRows.length,
      active_devices: active,
      open_alerts: openAlerts.length,
      avg_temp_c,
    },
  };
}

seedCampusMemory();

app.get("/health", (_req, res) => {
  getFirestore();
  res.json({ status: "ok", service: "storage-service", persistence: persistenceMode() });
});

app.post("/seed", async (_req, res) => {
  try {
    seedCampusMemory();
    const db = getFirestore();
    if (!db) {
      return res.json({
        ok: true,
        service: "storage-service",
        persistence: "memory",
        rooms: rooms.size,
        devices: devices.size,
        alerts: alerts.size,
      });
    }
    let batch = db.batch();
    let n = 0;
    const flush = async () => {
      if (n === 0) return;
      await batch.commit();
      batch = db.batch();
      n = 0;
    };
    const add = async (ref, data) => {
      batch.set(ref, data);
      n += 1;
      if (n >= 400) await flush();
    };
    for (const [id, r] of rooms) await add(db.collection("rooms").doc(id), { ...r });
    for (const [id, d] of devices) await add(db.collection("devices").doc(id), { ...d });
    for (const [id, a] of alerts) await add(db.collection("alerts").doc(id), { ...a });
    await flush();
    res.json({
      ok: true,
      service: "storage-service",
      persistence: "firestore",
      rooms: rooms.size,
      devices: devices.size,
      alerts: alerts.size,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

app.get("/campus/state", async (_req, res) => {
  try {
    const db = getFirestore();
    if (!db) return res.json(campusStateMemory());
    res.json(await campusStateFirestore(db));
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/storage/object", (req, res) => {
  const { name, bytes } = req.body || {};
  const id = uuid();
  res.status(201).json({
    id,
    name: String(name || "object.bin").slice(0, 120),
    bytes: Number(bytes) || 0,
    created_at: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  getFirestore();
  console.log(`storage-service :${PORT} persistence=${persistenceMode()}`);
});
