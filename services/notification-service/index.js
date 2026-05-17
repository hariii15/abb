import express from "express";
import cors from "cors";
import { notificationsRouter } from "./routes/notifications.js";

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4040;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health ─────────────────────────────────────────────────────────── */
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "notification" })
);

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use(notificationsRouter);

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[notification-service] listening on :${PORT}`);
});
