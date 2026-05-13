/**
 * Shared Firebase Admin bootstrap for Smart Campus services.
 * Resolves service account: FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS,
 * or repo-root default filename (see resolveServiceAccountPath).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");

/** Default filename when placed at repository root (matches common K8s/Firebase naming). */
const DEFAULT_KEY_GLOB_NAME = "abb-kube-firebase-adminsdk-fbsvc-7215afc70b.json";

export function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(process.cwd(), fromEnv);
  }
  const atRepoRoot = path.join(repoRoot, DEFAULT_KEY_GLOB_NAME);
  if (fs.existsSync(atRepoRoot)) return atRepoRoot;
  return "";
}

let _mode = "memory";

export function persistenceMode() {
  return _mode;
}

/** @returns {import('firebase-admin').app.App | null} */
export function getAdminApp() {
  if (admin.apps.length) {
    _mode = "firestore";
    return admin.app();
  }
  const enabled =
    process.env.FIREBASE_ADMIN_ENABLED === "true" ||
    process.env.NODE_ENV === "production";
  if (!enabled) {
    _mode = "memory";
    return null;
  }
  const keyPath = resolveServiceAccountPath();
  if (!keyPath || !fs.existsSync(keyPath)) {
    _mode = "memory";
    return null;
  }
  try {
    const json = JSON.parse(fs.readFileSync(keyPath, "utf8"));
    admin.initializeApp({ credential: admin.credential.cert(json) });
    _mode = "firestore";
    return admin.app();
  } catch (e) {
    console.error("[firebase-admin] init failed:", e?.message || e);
    _mode = "memory";
    return null;
  }
}

/** @returns {import('firebase-admin/firestore').Firestore | null} */
export function getFirestore() {
  const app = getAdminApp();
  return app ? admin.firestore(app) : null;
}

export function plainFirestoreData(data) {
  if (!data || typeof data !== "object") return data;
  const out = { ...data };
  for (const [k, v] of Object.entries(out)) {
    if (v && typeof v.toDate === "function") out[k] = v.toDate().toISOString();
  }
  return out;
}

export function plainDoc(docSnap) {
  if (!docSnap.exists) return null;
  return { id: docSnap.id, ...plainFirestoreData(docSnap.data()) };
}
