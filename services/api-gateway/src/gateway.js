/**
 * Smart Campus API Gateway — single entrypoint for the web UI.
 * Verifies Firebase ID tokens when Admin SDK is configured (unless GATEWAY_SKIP_AUTH=true).
 */
import cors from "cors";
import express from "express";
import admin from "firebase-admin";
import { getAdminApp } from "../../common/firebase-admin.js";

const PORT = Number(process.env.PORT || 4000);

const urls = {
  auth: (process.env.AUTH_SERVICE_URL ?? "http://127.0.0.1:4010").replace(/\/$/, ""),
  energy: (process.env.ENERGY_SERVICE_URL ?? "http://127.0.0.1:4020").replace(/\/$/, ""),
  cctv: (process.env.CCTV_SERVICE_URL ?? "http://127.0.0.1:4030").replace(/\/$/, ""),
  notifications: (process.env.NOTIFICATION_SERVICE_URL ?? "http://127.0.0.1:4040").replace(/\/$/, ""),
  storage: (process.env.STORAGE_SERVICE_URL ?? "http://127.0.0.1:4050").replace(/\/$/, ""),
};

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

function shouldEnforceAuth() {
  if (process.env.GATEWAY_SKIP_AUTH === "true") return false;
  if (process.env.GATEWAY_ENFORCE_AUTH === "true") return true;
  // Default: don't require auth for local dev UX, even if Admin SDK is configured.
  return process.env.NODE_ENV === "production";
}

function authHeaders(req) {
  const a = req.headers.authorization;
  return a ? { authorization: a } : {};
}

function bearerToken(req) {
  const raw = req.headers.authorization || "";
  const m = raw.match(/^Bearer\s+(.+)$/i);
  if (m) return m[1];
  const xf = req.headers["x-firebase-token"];
  if (typeof xf === "string" && xf.length > 0) return xf;
  return null;
}

app.use(async (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  if (req.path === "/health") return next();
  if (!shouldEnforceAuth()) return next();
  const appInst = getAdminApp();
  if (!appInst) return next();
  const token = bearerToken(req);
  if (!token) return res.status(401).json({ error: "missing_bearer_token" });
  try {
    await admin.auth().verifyIdToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "invalid_token" });
  }
});

function queryString(query) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const x of v) sp.append(k, String(x));
    else sp.append(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

async function pipeFetch(res, upstreamRes) {
  const text = await upstreamRes.text();
  const ct = upstreamRes.headers.get("content-type") || "application/json; charset=utf-8";
  res.status(upstreamRes.status);
  res.setHeader("content-type", ct);
  res.send(text);
}

app.get("/health", (_req, res) => {
  const adminOk = Boolean(getAdminApp());
  res.json({
    status: "ok",
    service: "api-gateway",
    auth_enforced: adminOk && shouldEnforceAuth(),
  });
});

app.get("/overview", async (req, res) => {
  try {
    const h = authHeaders(req);
    const [stateR, cctvR, energyR] = await Promise.all([
      fetch(`${urls.storage}/campus/state`, { headers: h }),
      fetch(`${urls.cctv}/cctv/summary`, { headers: h }),
      fetch(`${urls.energy}/energy/summary`, { headers: h }),
    ]);
    if (!stateR.ok || !cctvR.ok || !energyR.ok) {
      return res.status(502).json({
        error: "upstream_failure",
        storage: stateR.status,
        cctv: cctvR.status,
        energy: energyR.status,
      });
    }
    const state = await stateR.json();
    const cctv = await cctvR.json();
    const energy = await energyR.json();
    res.json({
      storage_mode: state.storage_mode,
      rooms: state.rooms,
      recent_alerts: state.recent_alerts,
      cctv,
      totals: {
        ...state.totals,
        estimated_kw: energy.estimated_kw,
      },
    });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post("/seed", async (req, res) => {
  const endpoints = [
    `${urls.storage}/seed`,
    `${urls.auth}/seed`,
    `${urls.energy}/seed`,
    `${urls.cctv}/seed`,
    `${urls.notifications}/seed`,
  ];
  const h = { "content-type": "application/json", ...authHeaders(req) };
  const settled = await Promise.allSettled(
    endpoints.map((u) => fetch(u, { method: "POST", headers: h })),
  );
  const details = settled.map((r, i) => ({
    url: endpoints[i],
    ok: r.status === "fulfilled" && r.value.ok,
    status: r.status === "fulfilled" ? r.value.status : 0,
  }));
  const ok = details.every((d) => d.ok);
  res.status(ok ? 200 : 502).json({ ok, details });
});

app.get("/attendance/recent", async (req, res) => {
  const q = queryString(req.query);
  const upstream = await fetch(`${urls.auth}/attendance/recent${q}`, { headers: authHeaders(req) });
  await pipeFetch(res, upstream);
});

app.post("/attendance/scan", async (req, res) => {
  const upstream = await fetch(`${urls.auth}/attendance/scan`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(req) },
    body: JSON.stringify(req.body ?? {}),
  });
  await pipeFetch(res, upstream);
});

app.get("/energy", async (req, res) => {
  const q = queryString(req.query);
  const upstream = await fetch(`${urls.energy}/energy${q}`, { headers: authHeaders(req) });
  await pipeFetch(res, upstream);
});

app.post("/energy/tick", async (req, res) => {
  const upstream = await fetch(`${urls.energy}/energy/tick`, {
    method: "POST",
    headers: authHeaders(req),
  });
  await pipeFetch(res, upstream);
});

app.get("/cctv/events", async (req, res) => {
  const q = queryString(req.query);
  const upstream = await fetch(`${urls.cctv}/cctv/events${q}`, { headers: authHeaders(req) });
  await pipeFetch(res, upstream);
});

app.post("/cctv/event", async (req, res) => {
  const upstream = await fetch(`${urls.cctv}/cctv/event`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(req) },
    body: JSON.stringify(req.body ?? {}),
  });
  await pipeFetch(res, upstream);
});

app.get("/notifications", async (req, res) => {
  const q = queryString(req.query);
  const upstream = await fetch(`${urls.notifications}/notifications${q}`, { headers: authHeaders(req) });
  await pipeFetch(res, upstream);
});

app.post("/notifications", async (req, res) => {
  const upstream = await fetch(`${urls.notifications}/notifications`, {
    method: "POST",
    headers: { "content-type": "application/json", ...authHeaders(req) },
    body: JSON.stringify(req.body ?? {}),
  });
  await pipeFetch(res, upstream);
});

/** Upsert signed-in user into Firestore `users` collection (Admin SDK). */
app.post("/users/sync", async (req, res) => {
  try {
    const raw = req.headers.authorization || "";
    const m = raw.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: "missing_bearer_token" });
    const decoded = await admin.auth().verifyIdToken(m[1]);
    const appInst = getAdminApp();
    if (!appInst) {
      return res.status(503).json({ error: "firebase_admin_not_configured" });
    }
    const db = admin.firestore();
    const ref = db.collection("users").doc(decoded.uid);
    const prev = await ref.get();
    await ref.set(
      {
        email: decoded.email ?? null,
        email_verified: Boolean(decoded.email_verified),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        last_seen_at: admin.firestore.FieldValue.serverTimestamp(),
        ...(prev.exists ? {} : { created_at: admin.firestore.FieldValue.serverTimestamp() }),
      },
      { merge: true },
    );
    res.json({ ok: true, uid: decoded.uid });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  getAdminApp();
  console.log(`api-gateway listening on :${PORT}`);
});
