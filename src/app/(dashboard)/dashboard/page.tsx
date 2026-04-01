"use client";

import { useEffect, useState } from "react";
import { salonRpc } from "@/lib/rpc-client";
import TopNav from "@/components/TopNav";
import type { Appointment } from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    revenue: 0,
    appointments: 0,
    newClients: 0,
    avgTicket: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<number[]>([]);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const result = await salonRpc("dashboardLoad", { startOfMonth, today, tomorrow });
      const d = result.data as {
        stats: {
          revenue: number;
          appointments: number;
          newClients: number;
          avgTicket: number;
        };
        upcomingAppointments: Appointment[];
        revenueByDay: number[];
        lowStockCount: number;
      };

      setStats(d.stats);
      setUpcomingAppointments(d.upcomingAppointments || []);
      setRevenueByDay(d.revenueByDay ?? Array(7).fill(0));
      setLowStockCount(d.lowStockCount ?? 0);
    } catch (e) {
      console.error("[dashboard]", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusColor: Record<string, string> = {
    confirmed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    no_show: "bg-slate-100 text-slate-700",
  };

  const statusLabel: Record<string, string> = {
    confirmed: "Confirmado",
    pending: "Pendente",
    completed: "Concluído",
    cancelled: "Cancelado",
    no_show: "Não compareceu",
  };

  if (loading) {
    return (
      <>
        <TopNav title="Dashboard" />
        <div className="p-4 sm:p-6 md:p-8 flex items-center justify-center h-64">
          <p className="text-on-surface-variant">Carregando...</p>
        </div>
      </>
    );
  }

  const maxRevenue = Math.max(...revenueByDay, 1);
  const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <>
      <TopNav title="Dashboard" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0">
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold font-headline tracking-tight text-on-background mb-2">
            Painel de Controle
          </h2>
          <p className="text-on-surface-variant font-medium">
            Visão geral do seu salão hoje.
          </p>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            {
              icon: "account_balance_wallet",
              label: "Faturamento Mensal",
              value: formatCurrency(stats.revenue),
            },
            {
              icon: "event_available",
              label: "Agendamentos",
              value: String(stats.appointments),
            },
            {
              icon: "person_add",
              label: "Novos Clientes",
              value: String(stats.newClients),
            },
            {
              icon: "receipt_long",
              label: "Ticket Médio",
              value: formatCurrency(stats.avgTicket),
            },
          ].map((card) => (
            <div
              key={card.label}
              className="p-6 bg-white rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.03)] border border-white/50 transition-transform hover:-translate-y-1"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary p-2 bg-primary/5 rounded-lg">
                  {card.icon}
                </span>
              </div>
              <p className="text-xs font-bold text-on-surface-variant tracking-wider uppercase mb-1">
                {card.label}
              </p>
              <p className="text-3xl font-extrabold font-headline text-on-background">
                {card.value}
              </p>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.03)] border border-white/50">
            <h3 className="text-xl font-bold font-headline mb-8">
              Receita por Dia da Semana
            </h3>
            <div className="h-48 flex items-end gap-2 px-4">
              {revenueByDay.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/15 hover:bg-primary/30 transition-colors rounded-t-sm relative group"
                  style={{ height: `${(val / maxRevenue) * 100}%`, minHeight: "4px" }}
                >
                  <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-on-background text-white text-[10px] py-1 px-2 rounded whitespace-nowrap">
                    {formatCurrency(val)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 mt-4 text-[11px] font-bold text-on-surface-variant uppercase">
              {dayLabels.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.03)] border border-white/50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">
                Alertas
              </h3>
              <div className="space-y-4">
                {lowStockCount > 0 && (
                  <div className="flex gap-4 p-3 rounded-lg bg-orange-50/50 border border-orange-100">
                    <span className="material-symbols-outlined text-orange-600">
                      inventory_2
                    </span>
                    <div>
                      <p className="text-sm font-bold text-orange-900">Estoque Baixo</p>
                      <p className="text-xs text-orange-800/70">
                        {lowStockCount} produto(s) abaixo do nível mínimo.
                      </p>
                    </div>
                  </div>
                )}
                {stats.appointments === 0 && (
                  <div className="flex gap-4 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                    <span className="material-symbols-outlined text-blue-700">
                      info
                    </span>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Sem agendamentos hoje</p>
                      <p className="text-xs text-blue-800/70">
                        Cadastre serviços e profissionais para começar.
                      </p>
                    </div>
                  </div>
                )}
                {lowStockCount === 0 && stats.appointments > 0 && (
                  <div className="flex gap-4 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
                    <span className="material-symbols-outlined text-emerald-700">
                      check_circle
                    </span>
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Tudo em ordem!</p>
                      <p className="text-xs text-emerald-800/70">
                        Nenhum alerta no momento.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.03)] border border-white/50 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8 flex justify-between items-center border-b border-slate-50 gap-2">
            <h3 className="text-lg sm:text-xl font-bold font-headline">
              Agendamentos de Hoje
            </h3>
          </div>
          <div className="overflow-x-auto">
            {upcomingAppointments.length === 0 ? (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl mb-4 block">
                  calendar_today
                </span>
                <p className="font-medium">Nenhum agendamento para hoje.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    {["Cliente", "Serviço", "Horário", "Profissional", "Status"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant whitespace-nowrap"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {upcomingAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-primary text-sm">
                            {apt.client?.full_name?.charAt(0) || "?"}
                          </div>
                          <p className="text-sm font-bold text-on-background truncate max-w-[120px] sm:max-w-none">
                            {apt.client?.full_name || "Cliente removido"}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <p className="text-sm font-medium text-on-background whitespace-nowrap">
                          {apt.service?.name || "-"}
                        </p>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <p className="text-sm font-bold text-on-background whitespace-nowrap">
                          {formatTime(apt.start_time)}
                        </p>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <p className="text-sm font-medium text-on-background truncate max-w-[100px] sm:max-w-[160px] md:max-w-none">
                          {apt.professional?.full_name || "-"}
                        </p>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <span
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                            statusColor[apt.status] || ""
                          }`}
                        >
                          {statusLabel[apt.status] || apt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
