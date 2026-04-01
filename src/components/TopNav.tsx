"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { Profile } from "@/lib/types";
import { useOptionalMobileNav } from "@/lib/mobile-nav";

export default function TopNav({ title }: { title: string }) {
  const mobileNav = useOptionalMobileNav();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let res: Response;
      try {
        res = await fetch("/api/auth/me");
      } catch (e) {
        if (!cancelled) {
          console.error("[TopNav] /api/auth/me", e);
          setReady(true);
        }
        return;
      }

      if (cancelled) return;

      if (!res.ok) {
        if (res.status !== 401) {
          console.error("[TopNav] /api/auth/me", res.status);
        }
        setReady(true);
        return;
      }

      const row = (await res.json()) as Profile;
      if (cancelled) return;
      setProfile(row);
      setReady(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.full_name || "Conta";
  const displaySalon = profile?.salon_name || "";
  const avatar = profile?.avatar_url;
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex justify-between items-center gap-3 min-w-0 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
        {mobileNav ? (
          <button
            type="button"
            onClick={() => mobileNav.toggle()}
            className="md:hidden shrink-0 flex items-center justify-center w-11 h-11 rounded-xl bg-surface-container-low text-slate-800 hover:bg-surface-container-high active:scale-95 transition-all"
            aria-label="Abrir menu"
            aria-expanded={mobileNav.open}
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
        ) : null}
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 font-headline truncate">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block text-right max-w-[140px] md:max-w-[200px]">
            <p className="text-xs font-bold text-on-surface leading-none truncate">
              {!ready ? "…" : displayName}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium truncate">
              {displaySalon}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold overflow-hidden shrink-0 relative">
            {ready && avatar ? (
              <Image
                src={avatar}
                alt=""
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
