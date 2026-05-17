import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory data store
let energyReadings = [];

// Pre-seed some readings
const buildings = ["Block A", "Block B", "Sports"];
for (let i = 0; i < 20; i++) {
  const ago = Math.floor(Math.random() * 86400) * 1000;
  energyReadings.push({
    id: crypto.randomUUID(),
    ts: new Date(Date.now() - ago).toISOString(),
    building: buildings[Math.floor(Math.random() * buildings.length)],
    kw: +(Math.random() * 50 + 10).toFixed(2),
  });
}

/* ── GET /energy?hours=N ────────────────────────────────────────────── */
router.get("/energy", (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const items = energyReadings
    .filter(r => r.ts >= since)
    .sort((a, b) => new Date(a.ts) - new Date(b.ts));

  res.json({ items });
});

/* ── POST /energy/tick ──────────────────────────────────────────────── */
router.post("/energy/tick", (req, res) => {
  const buildings = ["Block A", "Block B", "Sports"];
  const building = req.body?.building || buildings[Math.floor(Math.random() * buildings.length)];
  const kw = req.body?.kw !== undefined ? req.body.kw : +(Math.random() * 50 + 10).toFixed(2);

  const doc = {
    id: crypto.randomUUID(),
    ts: new Date().toISOString(),
    building,
    kw,
  };

  energyReadings.push(doc);
  res.json(doc);
});

export { router as energyRouter };
