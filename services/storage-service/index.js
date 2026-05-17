import express from "express";
import cors from "cors";
import { storageRouter } from "./routes/storage.js";

const PORT = process.env.STORAGE_SERVICE_PORT || 4050;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health ─────────────────────────────────────────────────────────── */
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "storage" })
);

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use(storageRouter);

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[storage-service] listening on :${PORT}`);
});
