"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

export default function TopNav({ title }: { title: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setProfile(data);
      }
    };
    fetchProfile();
  }, []);

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
              {profile?.full_name || "Carregando..."}
            </p>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-medium">
              {profile?.salon_name || ""}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold">
            {profile?.full_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        </div>
      </div>
    </header>
  );
}
