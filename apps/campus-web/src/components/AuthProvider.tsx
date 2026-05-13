"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  ensureFirebaseAuthRestored,
  isFirebaseClientConfigured,
  signOutUser,
  subscribeAuth,
} from "@/lib/firebaseClient";

type AuthState = {
  user: User | null;
  ready: boolean;
  error: string | null;
  firebaseConfigured: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firebaseConfigured = isFirebaseClientConfigured();

  useEffect(() => {
    if (!firebaseConfigured) {
      setReady(true);
      return;
    }
    const unsub = subscribeAuth((u) => {
      setUser(u);
      setReady(true);
    });
    return () => unsub();
  }, [firebaseConfigured]);

  const signOut = useCallback(async () => {
    setError(null);
    await signOutUser();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      error,
      firebaseConfigured,
      signOut,
    }),
    [user, ready, error, firebaseConfigured, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
