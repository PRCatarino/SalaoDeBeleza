"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/agenda", icon: "calendar_today", label: "Agenda" },
  { href: "/services", icon: "content_cut", label: "Serviços" },
  { href: "/financials", icon: "payments", label: "Financeiro" },
  { href: "/inventory", icon: "inventory_2", label: "Estoque" },
  { href: "/team", icon: "badge", label: "Equipe" },
  { href: "/profile", icon: "person", label: "Perfil e Loja" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-slate-50 p-4 gap-y-2">
      <div className="flex items-center gap-3 px-2 py-4 mb-6">
        <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
        <div>
          <h2 className="font-headline text-xl font-black text-slate-900 leading-none">
            Atelier
          </h2>
          <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant mt-1">
            Premium Management
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${
                isActive
                  ? "bg-white text-violet-700 shadow-sm font-bold ring-2 ring-violet-500/20"
                  : "text-slate-500 hover:bg-slate-200/50 hover:translate-x-1"
              }`}
            >
              <span
                className="material-symbols-outlined"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-200 space-y-1">
        <Link
          href="/agenda"
          className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-primary to-primary-container text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 mb-4"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span className="text-sm">Novo Agendamento</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-600 transition-colors w-full"
        >
          <span className="material-symbols-outlined">logout</span>
          <span className="text-[0.6875rem] uppercase tracking-widest font-bold">
            Sair
          </span>
        </button>
      </div>
    </aside>
  );
}
