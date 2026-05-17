import express from "express";
import cors from "cors";
import { usersRouter } from "./routes/users.js";
import { attendanceRouter } from "./routes/attendance.js";
import { seedRouter } from "./routes/seed.js";

const PORT = process.env.AUTH_SERVICE_PORT || 4010;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health ─────────────────────────────────────────────────────────── */
app.get("/health", (_req, res) => res.json({ status: "ok", service: "auth" }));

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use(usersRouter);
app.use(attendanceRouter);
app.use(seedRouter);

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[auth-service] listening on :${PORT}`);
});
