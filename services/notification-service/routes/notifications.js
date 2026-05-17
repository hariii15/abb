import { Router } from "express";
import crypto from "crypto";

const router = Router();

// In-memory data store
let notifications = [];

// Pre-seed some notifications
const notifTitles = [
  "Scheduled maintenance",
  "Fire drill reminder",
  "Exam schedule update",
  "Library closure notice",
];
const notifBodies = [
  "HVAC calibration Block B tonight 22:00–23:00.",
  "Monthly fire drill tomorrow at 10:00 AM.",
  "Mid-term exams rescheduled to next week.",
  "Library closed on Saturday for renovation.",
];
for (let i = 0; i < 4; i++) {
  const ago = Math.floor(Math.random() * 14400) * 1000;
  notifications.push({
    id: crypto.randomUUID(),
    title: notifTitles[i],
    body: notifBodies[i],
    channel: "in_app",
    read: Math.random() > 0.5,
    created_at: new Date(Date.now() - ago).toISOString(),
  });
}

/* ── GET /notifications?limit=N ─────────────────────────────────────── */
router.get("/notifications", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 30, 200);

  let items = [...notifications].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  if (req.query.unread_only === "true") {
    items = items.filter(n => !n.read);
  }

  res.json({ items: items.slice(0, limit) });
});

/* ── POST /notifications ────────────────────────────────────────────── */
router.post("/notifications", (req, res) => {
  const { title, body, channel } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: "title and body are required" });
  }

  const doc = {
    id: crypto.randomUUID(),
    title,
    body,
    channel: channel || "in_app",
    read: false,
    created_at: new Date().toISOString(),
  };

  notifications.push(doc);
  res.json(doc);
});

export { router as notificationsRouter };
