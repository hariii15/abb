"use client";

import {
  ensureFirebaseAuthRestored,
  getFirebaseAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebaseClient";

const base = () => {
  if (typeof window !== "undefined") {
    return "/api/backend";
  }
  return process.env.GATEWAY_INTERNAL_URL ?? "http://127.0.0.1:4000";
};

/** Next.js can strip `Authorization` on requests to Route Handlers; gateway also accepts `x-firebase-token`. */
const FIREBASE_TOKEN_HDR = "x-firebase-token";

async function authHeaders(): Promise<HeadersInit> {
  if (typeof window === "undefined") return {};
  if (!isFirebaseClientConfigured()) return {};
  await ensureFirebaseAuthRestored();
  const auth = getFirebaseAuth();
  let user = auth?.currentUser ?? null;
  const deadline = Date.now() + 4000;
  while (!user && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 80));
    user = getFirebaseAuth()?.currentUser ?? null;
  }
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    [FIREBASE_TOKEN_HDR]: token,
  };
}

export async function apiGet<T>(path: string): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const headers = { Accept: "application/json", ...(await authHeaders()) };
  const res = await fetch(`${base()}${p}`, { cache: "no-store", headers });
  if (!res.ok) {
    throw new Error(`${p} ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const headers: HeadersInit = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(await authHeaders()),
  };
  const res = await fetch(`${base()}${p}`, {
    method: "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${p} ${res.status}: ${t}`);
  }
  return res.json() as Promise<T>;
}
