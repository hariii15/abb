import express from "express";
import cors from "cors";
import { cctvRouter } from "./routes/cctv.js";

const PORT = process.env.CCTV_SERVICE_PORT || 4030;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health ─────────────────────────────────────────────────────────── */
app.get("/health", (_req, res) => res.json({ status: "ok", service: "cctv" }));

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use(cctvRouter);

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[cctv-service] listening on :${PORT}`);
});
