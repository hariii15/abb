import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

/* ------------------------------------------------------------------ */
/*  Resolve .env location — services/.env lives one level up from     */
/*  each service directory.                                           */
/* ------------------------------------------------------------------ */

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

// Lightweight .env parser (avoids adding dotenv as a shared dep)
function loadEnv(filePath) {
  try {
    const lines = readFileSync(filePath, "utf-8").split("\n");
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const idx = line.indexOf("=");
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env is optional — fall back to existing env vars
  }
}

loadEnv(envPath);

/* ------------------------------------------------------------------ */
/*  Firebase Admin initialisation                                     */
/* ------------------------------------------------------------------ */

if (!admin.apps.length) {
  const credPath = process.env.FIREBASE_ADMIN_CREDENTIAL_PATH;

  if (credPath) {
    const absPath = resolve(__dirname, "..", credPath);
    try {
      const serviceAccount = JSON.parse(readFileSync(absPath, "utf-8"));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[firebase] Admin SDK initialised with service account.");
    } catch (err) {
      console.warn(`[firebase] WARNING: Could not read credentials at ${absPath}. Make sure to place your firebase-adminsdk.json there.`);
      // Initialize without credentials so it doesn't crash, but it will fail on actual db calls
      admin.initializeApp();
    }
  } else if (process.env.FIREBASE_PROJECT_ID) {
    // Application Default Credentials (Cloud Run, GKE, etc.)
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    console.log("[firebase] Admin SDK initialised with ADC / project ID.");
  } else {
    console.warn(
      "[firebase] No credentials found — set FIREBASE_ADMIN_CREDENTIAL_PATH or FIREBASE_PROJECT_ID in services/.env"
    );
    admin.initializeApp();
  }
}

export { admin };
