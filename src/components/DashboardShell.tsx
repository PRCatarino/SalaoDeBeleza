"use client";

import { MobileNavProvider } from "@/lib/mobile-nav";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MobileNavProvider>
      <div className="min-h-screen bg-surface min-w-0">
        <Sidebar />
        <main className="md:ml-64 min-h-screen min-w-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    </MobileNavProvider>
  );
}
