/** Itens do menu do painel (sidebar + barra inferior mobile). */
export const dashboardNavItems = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", shortLabel: "Início" },
  { href: "/agenda", icon: "calendar_today", label: "Agenda", shortLabel: "Agenda" },
  { href: "/services", icon: "content_cut", label: "Serviços", shortLabel: "Serviços" },
  { href: "/financials", icon: "payments", label: "Financeiro", shortLabel: "Financ." },
  { href: "/inventory", icon: "inventory_2", label: "Estoque", shortLabel: "Estoque" },
  { href: "/team", icon: "badge", label: "Equipe", shortLabel: "Equipe" },
  { href: "/profile", icon: "person", label: "Perfil e Loja", shortLabel: "Perfil" },
] as const;
