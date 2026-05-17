import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory data store
let cctvEvents = [];

// Pre-seed some events
const labels = ["motion", "perimeter", "crowd", "vehicle"];
for (let i = 0; i < 8; i++) {
  const ago = Math.floor(Math.random() * 3600) * 1000;
  cctvEvents.push({
    id: crypto.randomUUID(),
    camera_id: `CAM-${Math.floor(Math.random() * 5) + 1}`,
    label: labels[Math.floor(Math.random() * labels.length)],
    created_at: new Date(Date.now() - ago).toISOString(),
  });
}

/* ── GET /cctv/events?limit=N ───────────────────────────────────────── */
router.get("/cctv/events", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);
  
  const sorted = [...cctvEvents].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  res.json({ items: sorted.slice(0, limit) });
});

/* ── POST /cctv/event ───────────────────────────────────────────────── */
router.post("/cctv/event", (req, res) => {
  const { camera_id, label } = req.body;
  if (!camera_id || !label) {
    return res.status(400).json({ error: "camera_id and label are required" });
  }

  const doc = {
    id: crypto.randomUUID(),
    camera_id,
    label,
    created_at: new Date().toISOString(),
  };

  cctvEvents.push(doc);
  res.json(doc);
});

export { router as cctvRouter };
