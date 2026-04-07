"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dashboardNavItems } from "@/lib/nav-items";

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[38] bg-white/95 backdrop-blur-xl border-t border-slate-200/90 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(11,28,48,0.07)]"
      aria-label="Navegação principal"
    >
      <div className="flex overflow-x-auto overscroll-x-contain gap-0.5 px-1 min-h-[3.5rem] items-stretch [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory">
        {dashboardNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[4.25rem] max-w-[5.5rem] flex-1 snap-center shrink-0 rounded-xl py-1.5 px-1 transition-colors ${
                isActive
                  ? "text-violet-700 bg-violet-50 font-bold"
                  : "text-slate-500 active:bg-slate-100"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px] leading-none"
                style={
                  isActive ? { fontVariationSettings: "'FILL' 1" } : undefined
                }
              >
                {item.icon}
              </span>
              <span className="text-[0.625rem] leading-tight text-center line-clamp-2 px-0.5">
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
