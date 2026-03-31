"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function TopNav({ title }: { title: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackSalon, setFallbackSalon] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setReady(true);
        return;
      }

      const metaName =
        (user.user_metadata?.full_name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Usuário";
      const metaSalon =
        (user.user_metadata?.salon_name as string | undefined) || "Meu Salão";

      const { data: row, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("[TopNav] profiles", error);
        setFallbackName(metaName);
        setFallbackSalon(metaSalon);
        setReady(true);
        return;
      }

      if (row) {
        setProfile(row as Profile);
        setReady(true);
        return;
      }

      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          full_name: metaName,
          salon_name: metaSalon,
        })
        .select("*")
        .maybeSingle();

      if (cancelled) return;

      if (!insErr && inserted) {
        setProfile(inserted as Profile);
      } else {
        if (insErr) console.error("[TopNav] insert profile", insErr);
        setFallbackName(metaName);
        setFallbackSalon(metaSalon);
      }
      setReady(true);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = profile?.full_name || fallbackName || "Conta";
  const displaySalon = profile?.salon_name || fallbackSalon || "";
  const avatar = profile?.avatar_url;
  const initial = (displayName || "?").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headline">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-on-surface leading-none">
              {!ready ? "…" : displayName}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
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
