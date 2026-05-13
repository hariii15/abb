"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";

function webConfig() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  if (!apiKey || !authDomain || !projectId) return null;
  return { apiKey, authDomain, projectId, appId: appId || undefined, messagingSenderId: messagingSenderId || undefined };
}

export function isFirebaseClientConfigured(): boolean {
  return webConfig() !== null;
}

function getAppInstance(): FirebaseApp | null {
  const cfg = webConfig();
  if (!cfg) return null;
  if (!getApps().length) initializeApp(cfg);
  return getApp();
}

export function getFirebaseAuth() {
  const app = getAppInstance();
  return app ? getAuth(app) : null;
}

/**
 * Wait until persisted auth has been loaded from IndexedDB (not just the first
 * `onAuthStateChanged` tick, which can fire before `currentUser` is restored).
 */
export async function ensureFirebaseAuthRestored(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isFirebaseClientConfigured()) return;
  const auth = getFirebaseAuth();
  if (!auth) return;
  // Firebase JS SDK — resolves when initial session restoration is complete.
  await auth.authStateReady();
}

export function subscribeAuth(cb: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export async function getIdTokenOptional(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

/** Force refresh after sign-in so the gateway receives a fresh JWT immediately. */
export async function getFreshIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(true);
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase web SDK is not configured.");
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(email: string, password: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase web SDK is not configured.");
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}
