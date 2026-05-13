"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiPost } from "@/lib/api";
import {
  getFreshIdToken,
  isFirebaseClientConfigured,
  signInWithEmail,
  signUpWithEmail,
} from "@/lib/firebaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const configured = isFirebaseClientConfigured();

  async function afterAuth() {
    await getFreshIdToken();
    await apiPost<{ ok: boolean }>("/users/sync");
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!configured) return;
    setBusy(true);
    setMsg(null);
    try {
      await signInWithEmail(email, password);
      await afterAuth();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister() {
    if (!configured) return;
    setBusy(true);
    setMsg(null);
    try {
      await signUpWithEmail(email, password);
      await afterAuth();
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <main style={{ maxWidth: 520, margin: "2rem auto", padding: "0 1rem" }}>
        <h1 className="page-title">Sign in</h1>
        <p className="page-desc">
          Add Firebase web configuration to <code>apps/campus-web/.env.local</code> (see{" "}
          <code>.env.example</code>), then restart Next.js. Required variables:{" "}
          <code>NEXT_PUBLIC_FIREBASE_API_KEY</code>, <code>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</code>,{" "}
          <code>NEXT_PUBLIC_FIREBASE_PROJECT_ID</code>.
        </p>
        <p className="muted">
          Without these, the API gateway cannot receive ID tokens and returns <strong>401</strong> when auth is
          enforced.
        </p>
        <Link href="/">← Back</Link>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 440, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 className="page-title">Smart Campus</h1>
      <p className="page-desc">Sign in with your Firebase account (Email/Password).</p>

      {msg && (
        <div className="card" style={{ marginBottom: "1rem", borderColor: "var(--danger)", color: "var(--danger)" }}>
          {msg}
        </div>
      )}

      <form className="card" onSubmit={onSignIn} style={{ display: "grid", gap: "0.75rem" }}>
        <label className="muted">
          Email
          <input
            className="inp"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>
        <label className="muted">
          Password
          <input
            className="inp"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: "100%", marginTop: "0.25rem" }}
          />
        </label>
        <div className="flex" style={{ marginTop: "0.25rem" }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Sign in
          </button>
          <button type="button" className="btn" disabled={busy} onClick={() => void onRegister()}>
            Create account
          </button>
        </div>
      </form>

      <p className="muted" style={{ marginTop: "1.25rem", fontSize: "0.85rem" }}>
        In Firebase Console → Authentication → Sign-in method, enable <strong>Email/Password</strong>.
      </p>
    </main>
  );
}
