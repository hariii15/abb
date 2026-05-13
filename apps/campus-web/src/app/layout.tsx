import type { Metadata } from "next";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { AuthProvider } from "@/components/AuthProvider";
import { AuthGate } from "@/components/AuthGate";

export const metadata: Metadata = {
  title: "Smart Campus | KubeMind",
  description: "Campus operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>
            <Shell>{children}</Shell>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
