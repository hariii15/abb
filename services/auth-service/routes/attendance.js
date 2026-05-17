import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory data store
let attendanceLogs = [];

// Pre-seed some attendance logs
const GATES = ["North Gate", "South Gate", "Library Gate"];
for (let i = 0; i < 5; i++) {
  const ago = Math.floor(Math.random() * 3600 * 4) * 1000;
  attendanceLogs.push({
    id: crypto.randomUUID(),
    student_id: String(Math.floor(Math.random() * 3) + 1),
    name: ["Aarav Sharma", "Priya Patel", "Rahul Gupta"][Math.floor(Math.random() * 3)],
    gate: GATES[Math.floor(Math.random() * GATES.length)],
    scanned_at: new Date(Date.now() - ago).toISOString(),
  });
}

/* ── GET /attendance/recent?limit=N ─────────────────────────────────── */
router.get("/attendance/recent", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  
  const sorted = [...attendanceLogs].sort((a, b) => 
    new Date(b.scanned_at) - new Date(a.scanned_at)
  );

  res.json({ items: sorted.slice(0, limit) });
});

/* ── POST /attendance/scan ──────────────────────────────────────────── */
router.post("/attendance/scan", (req, res) => {
  const { student_id, name, gate } = req.body;

  if (!student_id || !name) {
    return res.status(400).json({ error: "student_id and name are required" });
  }

  const doc = {
    id: crypto.randomUUID(),
    student_id,
    name,
    gate: gate || "Main Gate",
    scanned_at: new Date().toISOString(),
  };

  attendanceLogs.push(doc);
  res.json(doc);
});

export { router as attendanceRouter };
