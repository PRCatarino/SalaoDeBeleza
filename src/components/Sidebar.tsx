"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useOptionalMobileNav } from "@/lib/mobile-nav";

const navItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard" },
  { href: "/agenda", icon: "calendar_today", label: "Agenda" },
  { href: "/services", icon: "content_cut", label: "Serviços" },
  { href: "/financials", icon: "payments", label: "Financeiro" },
  { href: "/inventory", icon: "inventory_2", label: "Estoque" },
  { href: "/team", icon: "badge", label: "Equipe" },
  { href: "/profile", icon: "person", label: "Perfil e Loja" },
];

function NavList({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 ${
              isActive
                ? "bg-white text-violet-700 shadow-sm font-bold ring-2 ring-violet-500/20"
                : "text-slate-500 hover:bg-slate-200/50 active:bg-slate-200/70"
            }`}
          >
            <span
              className="material-symbols-outlined shrink-0"
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
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const mobileNav = useOptionalMobileNav();
  /** Só depende de pathname — não use o objeto `mobileNav` nas deps (muda quando `open` muda e fechava o drawer logo ao abrir). */
  const setOpenMobile = mobileNav?.setOpen;

  useEffect(() => {
    setOpenMobile?.(false);
  }, [pathname, setOpenMobile]);

  useEffect(() => {
    if (!mobileNav?.open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNav?.open]);

  const closeMobile = () => mobileNav?.setOpen(false);

  const handleSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    closeMobile();
    router.push("/login");
  };

  const footer = (mobile: boolean) => (
    <div
      className={`mt-auto pt-6 border-t border-slate-200 space-y-1 shrink-0 ${
        mobile ? "pb-[max(1rem,env(safe-area-inset-bottom))]" : ""
      }`}
    >
      <Link
        href="/agenda"
        onClick={mobile ? closeMobile : undefined}
        className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-primary to-primary-container text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:opacity-90 transition-all active:scale-95 mb-4"
      >
        <span className="material-symbols-outlined text-sm">add</span>
        <span className="text-sm">Novo Agendamento</span>
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-600 transition-colors w-full rounded-xl hover:bg-slate-100/80"
      >
        <span className="material-symbols-outlined">logout</span>
        <span className="text-[0.6875rem] uppercase tracking-widest font-bold">
          Sair
        </span>
      </button>
    </div>
  );

  const brand = (compact?: boolean) => (
    <div
      className={`flex items-center gap-3 px-2 shrink-0 ${
        compact ? "py-2 mb-2" : "py-4 mb-6"
      }`}
    >
      <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center text-white shrink-0">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>
      </div>
      <div className="min-w-0">
        <h2 className="font-headline text-xl font-black text-slate-900 leading-none truncate">
          Atelier
        </h2>
        <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant mt-1">
          Premium Management
        </p>
      </div>
    </div>
  );

  return (
    <>
      {mobileNav?.open ? (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closeMobile}
            aria-label="Fechar menu"
          />
          <aside className="absolute left-0 top-0 bottom-0 w-[min(288px,88vw)] flex flex-col bg-slate-50 p-4 shadow-2xl pt-[max(1rem,env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-2 shrink-0">
              <div className="min-w-0 flex-1">{brand(true)}</div>
              <button
                type="button"
                onClick={closeMobile}
                className="p-2 rounded-xl hover:bg-slate-200/80 text-slate-600 shrink-0"
                aria-label="Fechar"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <NavList pathname={pathname} onNavigate={closeMobile} />
            {footer(true)}
          </aside>
        </div>
      ) : null}

      <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 z-40 bg-slate-50 p-4 gap-y-2">
        {brand()}
        <NavList pathname={pathname} />
        {footer(false)}
      </aside>
    </>
  );
}
