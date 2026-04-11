"use client";

import { useEffect, useState } from "react";
import { MobileNavProvider } from "@/lib/mobile-nav";
import { databaseErrorMessage } from "@/lib/db-user-messages";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dbErrorCode, setDbErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (cancelled || res.ok) return;
        if (res.status !== 503) return;
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setDbErrorCode(j.error ?? "db_unreachable");
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-surface min-w-0">
        {dbErrorCode ? (
          <div
            role="alert"
            className="bg-error-container text-on-error-container px-4 py-3 text-sm font-medium border-b border-error md:ml-64"
          >
            {databaseErrorMessage(dbErrorCode)}
          </div>
        ) : null}
        <Sidebar />
        <main className="md:ml-64 min-h-screen min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </MobileNavProvider>
  );
}
