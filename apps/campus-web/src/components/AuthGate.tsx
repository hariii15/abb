"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, firebaseConfigured } = useAuth();

  useEffect(() => {
    if (!firebaseConfigured) return;
    if (!ready) return;
    if (!user && pathname !== "/login") {
      router.replace("/login");
      return;
    }
    if (user && pathname === "/login") {
      router.replace("/");
    }
  }, [firebaseConfigured, ready, user, pathname, router]);

  if (firebaseConfigured && !ready) {
    return (
      <div style={{ padding: "2rem", color: "var(--muted)", maxWidth: 1200, margin: "0 auto" }}>
        Loading session…
      </div>
    );
  }

  if (firebaseConfigured && !user && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}
