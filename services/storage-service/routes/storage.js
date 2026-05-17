import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory data store
const rooms = [
  { id: crypto.randomUUID(), name: "LH-101", building: "Block A", occupancy: 42, temp_c: 23.5 },
  { id: crypto.randomUUID(), name: "LH-202", building: "Block A", occupancy: 38, temp_c: 24.1 },
  { id: crypto.randomUUID(), name: "Lab-301", building: "Block B", occupancy: 25, temp_c: 22.8 },
  { id: crypto.randomUUID(), name: "Lab-302", building: "Block B", occupancy: 18, temp_c: 22.4 },
  { id: crypto.randomUUID(), name: "Gym Hall", building: "Sports", occupancy: 60, temp_c: 26.2 },
];

const devices = [];
const deviceTypes = ["sensor", "camera", "actuator", "meter"];
for (let i = 0; i < 12; i++) {
  devices.push({
    id: crypto.randomUUID(),
    name: `Device-${String(i + 1).padStart(3, "0")}`,
    type: deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
    active: Math.random() > 0.2,
    room_id: rooms[Math.floor(Math.random() * rooms.length)].name,
  });
}

const alerts = [];
const severities = ["info", "warning", "critical"];
const messages = [
  "Temperature above threshold in Lab-301",
  "Motion detected in restricted area",
  "Power consumption spike in Block B",
  "HVAC malfunction in LH-202",
  "Network latency on campus sensors",
];
for (let i = 0; i < 5; i++) {
  const ago = Math.floor(Math.random() * 7200) * 1000;
  alerts.push({
    id: crypto.randomUUID(),
    severity: severities[Math.floor(Math.random() * severities.length)],
    message: messages[i],
    created_at: new Date(Date.now() - ago).toISOString(),
  });
}

/* ── GET /storage/overview ──────────────────────────────────────────── */
router.get("/storage/overview", (_req, res) => {
  const recent_alerts = [...alerts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
  const activeDevices = devices.filter((d) => d.active).length;
  const avgTemp = rooms.length > 0 ? rooms.reduce((sum, r) => sum + (r.temp_c || 0), 0) / rooms.length : 0;

  res.json({
    storage_mode: "in-memory",
    totals: {
      devices: devices.length,
      active_devices: activeDevices,
      open_alerts: recent_alerts.length,
      avg_temp_c: +avgTemp.toFixed(1),
      estimated_kw: 0, 
    },
    rooms,
    recent_alerts,
  });
});

export { router as storageRouter };
