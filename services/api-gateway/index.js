import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { authMiddleware } from "./middleware/auth.js";

const PORT = process.env.GATEWAY_PORT || 4000;
const AUTH_URL = `http://127.0.0.1:${process.env.AUTH_SERVICE_PORT || 4010}`;
const ENERGY_URL = `http://127.0.0.1:${process.env.ENERGY_SERVICE_PORT || 4020}`;
const CCTV_URL = `http://127.0.0.1:${process.env.CCTV_SERVICE_PORT || 4030}`;
const NOTIFY_URL = `http://127.0.0.1:${process.env.NOTIFICATION_SERVICE_PORT || 4040}`;
const STORAGE_URL = `http://127.0.0.1:${process.env.STORAGE_SERVICE_PORT || 4050}`;

const app = express();
app.use(cors());
app.use(express.json());

/* ── Health (no auth) ───────────────────────────────────────────────── */
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "gateway" })
);

/* ── Auth middleware for all downstream routes ──────────────────────── */
app.use(authMiddleware);

/* ── /overview — aggregated endpoint ────────────────────────────────── */
/* Merges data from storage, cctv, and energy services into the         */
/* OverviewResponse shape the frontend expects.                         */
app.get("/overview", async (_req, res) => {
  try {
    const [storageRes, cctvRes, energyRes] = await Promise.allSettled([
      fetch(`${STORAGE_URL}/storage/overview`).then((r) => r.json()),
      fetch(`${CCTV_URL}/cctv/events?limit=100`).then((r) => r.json()),
      fetch(`${ENERGY_URL}/energy?hours=1`).then((r) => r.json()),
    ]);

    const storageData = storageRes.status === "fulfilled" ? storageRes.value : {};
    
    const storage =
      storageData && storageData.totals
        ? storageData
        : {
            storage_mode: "firestore",
            totals: { devices: 0, active_devices: 0, open_alerts: 0, avg_temp_c: 0, estimated_kw: 0 },
            rooms: [],
            recent_alerts: [],
          };

    // CCTV summary
    const cctvEvents =
      cctvRes.status === "fulfilled" ? cctvRes.value.items || [] : [];
    const cameraIds = new Set(cctvEvents.map((e) => e.camera_id));
    const lastMotion = cctvEvents.length > 0 ? cctvEvents[0].created_at : null;

    // Energy — latest kW sum
    const energyItems =
      energyRes.status === "fulfilled" ? energyRes.value.items || [] : [];
    let estimatedKw = 0;
    if (energyItems.length > 0) {
      // Sum latest reading per building
      const latest = {};
      for (const p of energyItems) {
        latest[p.building] = p.kw;
      }
      estimatedKw = Object.values(latest).reduce((s, v) => s + v, 0);
    }

    storage.totals.estimated_kw = +estimatedKw.toFixed(1);

    res.json({
      ...storage,
      cctv: {
        total: Math.max(cameraIds.size, 4), // at least 4 cameras in UI
        online: cameraIds.size,
        last_motion_at: lastMotion,
      },
    });
  } catch (err) {
    console.error("[gateway] /overview error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ── Helper to preserve paths when proxying ─────────────────────────── */
const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => req.originalUrl,
});

/* ── Proxy: Auth Service routes ─────────────────────────────────────── */
app.use("/users", createProxyMiddleware(proxyOptions(AUTH_URL)));
app.use("/attendance", createProxyMiddleware(proxyOptions(AUTH_URL)));
app.use("/seed", createProxyMiddleware(proxyOptions(AUTH_URL)));

/* ── Proxy: Energy Service routes ───────────────────────────────────── */
app.use("/energy", createProxyMiddleware(proxyOptions(ENERGY_URL)));

/* ── Proxy: CCTV Service routes ─────────────────────────────────────── */
app.use("/cctv", createProxyMiddleware(proxyOptions(CCTV_URL)));

/* ── Proxy: Notification Service routes ─────────────────────────────── */
app.use("/notifications", createProxyMiddleware(proxyOptions(NOTIFY_URL)));

/* ── Proxy: Storage Service routes ──────────────────────────────────── */
app.use("/storage", createProxyMiddleware(proxyOptions(STORAGE_URL)));

/* ── Start ──────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`[api-gateway] listening on :${PORT}`);
  console.log(`  auth    → ${AUTH_URL}`);
  console.log(`  energy  → ${ENERGY_URL}`);
  console.log(`  cctv    → ${CCTV_URL}`);
  console.log(`  notify  → ${NOTIFY_URL}`);
  console.log(`  storage → ${STORAGE_URL}`);
  console.log(
    `  skip-auth: ${process.env.GATEWAY_SKIP_AUTH === "true" ? "YES" : "NO"}`
  );
});
