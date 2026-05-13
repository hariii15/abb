"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import styles from "./Shell.module.css";

const links = [
  { href: "/", label: "Overview" },
  { href: "/attendance", label: "Attendance" },
  { href: "/energy", label: "Energy" },
  { href: "/cctv", label: "CCTV" },
  { href: "/notifications", label: "Notifications" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, ready, error, firebaseConfigured, signOut } = useAuth();
  const isLogin = pathname === "/login";

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo}>KubeMind</span>
          <span className={styles.sub}>Smart Campus</span>
        </div>
        {!isLogin && (
          <nav className={styles.nav}>
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={pathname === l.href ? styles.active : undefined}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {!isLogin && (
          <div className={styles.auth}>
            {!firebaseConfigured && (
              <span className={styles.authHint} title="Add NEXT_PUBLIC_FIREBASE_* to .env.local">
                Auth: missing web config — API may return 401
              </span>
            )}
            {firebaseConfigured && !ready && <span className={styles.authHint}>Loading…</span>}
            {firebaseConfigured && ready && user && (
              <>
                <span className={styles.authUser} title={user.uid}>
                  {user.email ?? "Signed in"}
                </span>
                <button type="button" className={styles.authBtn} onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            )}
            {firebaseConfigured && ready && !user && (
              <Link href="/login" className={styles.authLink}>
                Sign in
              </Link>
            )}
          </div>
        )}
      </header>
      {error && (
        <div className={styles.banner}>
          Firebase: {error} — check Authentication → Sign-in methods in Firebase Console.
        </div>
      )}
      <div className={styles.main}>{children}</div>
    </div>
  );
}
