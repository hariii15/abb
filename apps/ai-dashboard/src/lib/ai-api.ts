"use client";

const AI_BASE_URL = "http://localhost:8000";

export async function aiGet<T>(path: string): Promise<T> {
  // Ensure path ends with / to avoid 307 redirects in FastAPI
  const cleanPath = path.endsWith("/") ? path : `${path}/`;
  const p = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  
  const res = await fetch(`${AI_BASE_URL}${p}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`AI API Error: ${p} ${res.status}`);
  }
  return res.json() as Promise<T>;
}
