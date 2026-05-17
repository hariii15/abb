import express from "express";
import cors from "cors";
import { energyRouter } from "./routes/energy.js";

const PORT = process.env.ENERGY_SERVICE_PORT || 4020;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health ─────────────────────────────────────────────────────────── */
app.get("/health", (_req, res) => res.json({ status: "ok", service: "energy" }));

/* ── Routes ─────────────────────────────────────────────────────────── */
app.use(energyRouter);

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[energy-service] listening on :${PORT}`);
});
