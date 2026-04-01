"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { Transaction } from "@/lib/types";

export default function FinancialsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    type: "income" as string,
    category: "Serviço",
    description: "",
    amount: "",
    payment_method: "Cartão",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(true);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let start: Date;
    if (period === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === "week") {
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    return start.toISOString();
  }, [period]);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const startDate = getDateRange();
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", startDate)
      .order("date", { ascending: false });
    setTransactions(data || []);
    setLoading(false);
  }, [getDateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    await supabase.from("transactions").insert({
      type: form.type,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount),
      payment_method: form.payment_method,
      date: new Date(form.date + "T12:00:00").toISOString(),
    });
    setModalOpen(false);
    setForm({
      type: "income",
      category: "Serviço",
      description: "",
      amount: "",
      payment_method: "Cartão",
      date: new Date().toISOString().split("T")[0],
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta transação?")) return;
    const supabase = createClient();
    await supabase.from("transactions").delete().eq("id", id);
    fetchData();
  };

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpense;
  const avgTicket = transactions.filter((t) => t.type === "income").length > 0
    ? totalIncome / transactions.filter((t) => t.type === "income").length
    : 0;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const incomeByCategory: Record<string, number> = {};
  transactions.filter((t) => t.type === "income").forEach((t) => {
    incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + Number(t.amount);
  });
  const sortedCategories = Object.entries(incomeByCategory).sort(([, a], [, b]) => b - a);

  const paymentIcons: Record<string, string> = {
    "Cartão": "credit_card",
    "PIX": "qr_code_2",
    "Dinheiro": "payments",
    "Transferência": "account_balance",
  };

  const categoryColors: Record<string, string> = {
    "Serviço": "bg-primary-fixed text-on-primary-fixed",
    "Produto": "bg-secondary-fixed text-on-secondary-fixed",
    "Aluguel": "bg-error-container text-on-error-container",
    "Utilidades": "bg-slate-200 text-slate-600",
    "Salário": "bg-amber-100 text-amber-700",
    "Marketing": "bg-blue-100 text-blue-700",
  };

  return (
    <>
      <TopNav title="Financeiro" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-6">
          <div className="min-w-0">
            <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-background tracking-tight">Saúde Financeira</h1>
            <p className="text-on-surface-variant mt-2 font-medium">Monitore receitas, despesas e lucratividade em tempo real.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-surface-container-low p-1 rounded-xl flex gap-1">
              {(["today", "week", "month"] as const).map((p) => (
                <button type="button" key={p} onClick={() => setPeriod(p)} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${period === p ? "bg-white shadow-sm text-primary" : "text-on-surface-variant"}`}>
                  {p === "today" ? "Hoje" : p === "week" ? "Semana" : "Mês"}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setModalOpen(true)} className="bg-linear-to-r from-primary to-primary-container text-white px-5 sm:px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all w-full md:w-auto">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              Nova Transação
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { icon: "payments", label: "Receita Total", value: formatCurrency(totalIncome), color: "text-primary", bgColor: "bg-primary-fixed" },
            { icon: "shopping_cart_checkout", label: "Despesas Totais", value: formatCurrency(totalExpense), color: "text-error", bgColor: "bg-error-container" },
            { icon: "account_balance_wallet", label: "Lucro Líquido", value: formatCurrency(netProfit), color: "text-violet-700", bgColor: "bg-violet-100", valueColor: netProfit >= 0 ? "text-emerald-600" : "text-error" },
            { icon: "receipt_long", label: "Ticket Médio", value: formatCurrency(avgTicket), color: "text-secondary", bgColor: "bg-secondary-fixed" },
          ].map((card) => (
            <div key={card.label} className="bg-white p-6 rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] border border-transparent hover:border-primary/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className={`material-symbols-outlined ${card.color} p-2 ${card.bgColor} rounded-lg`}>{card.icon}</span>
              </div>
              <p className="text-[0.6875rem] uppercase tracking-[0.15em] text-on-surface-variant font-bold mb-1">{card.label}</p>
              <p className={`font-headline text-3xl font-extrabold ${card.valueColor || "text-on-background"}`}>{card.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white rounded-xl p-8 shadow-[0_8px_32px_rgba(11,28,48,0.04)]">
            <h3 className="text-lg font-bold text-on-background font-headline mb-6">Receita por Categoria</h3>
            {sortedCategories.length === 0 ? (
              <p className="text-on-surface-variant text-sm">Nenhuma receita registrada no período.</p>
            ) : (
              <div className="space-y-6">
                {sortedCategories.map(([cat, val]) => {
                  const pct = totalIncome > 0 ? Math.round((val / totalIncome) * 100) : 0;
                  return (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>{cat}</span>
                        <span>{pct}% ({formatCurrency(val)})</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="bg-surface-container-low rounded-xl p-8">
            <h3 className="text-lg font-bold text-on-background font-headline mb-6">Resumo</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-on-surface-variant">Transações</span>
                <span className="font-bold">{transactions.length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-on-surface-variant">Receitas</span>
                <span className="font-bold text-emerald-600">{transactions.filter((t) => t.type === "income").length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-on-surface-variant">Despesas</span>
                <span className="font-bold text-error">{transactions.filter((t) => t.type === "expense").length}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-on-surface-variant">Margem</span>
                <span className={`font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-error"}`}>
                  {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] overflow-hidden border border-slate-50">
          <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="text-lg font-bold text-on-background font-headline">Transações Recentes</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-on-surface-variant">Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl mb-4 block">receipt_long</span>
              <p className="font-medium">Nenhuma transação no período selecionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container-low/50">
                    {["Data", "Descrição", "Categoria", "Método", "Valor", ""].map((h) => (
                      <th key={h} className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 text-sm font-medium text-slate-500 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 min-w-[140px]">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === "income" ? "bg-violet-100 text-violet-700" : "bg-red-100 text-error"}`}>
                            <span className="material-symbols-outlined text-sm">{t.type === "income" ? "trending_up" : "trending_down"}</span>
                          </div>
                          <span className="text-sm font-bold text-on-background line-clamp-2 break-words">{t.description}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-full ${categoryColors[t.category] || "bg-slate-100 text-slate-600"}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">{paymentIcons[t.payment_method || ""] || "payments"}</span>
                          {t.payment_method || "-"}
                        </div>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4 whitespace-nowrap">
                        <span className={`text-sm font-bold ${t.type === "income" ? "text-emerald-600" : "text-error"}`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(Number(t.amount))}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 md:px-8 py-3 sm:py-4">
                        <button type="button" onClick={() => handleDelete(t.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-error-container rounded text-on-surface-variant hover:text-error transition-all">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Transação">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Tipo</label>
            <div className="flex gap-3">
              {[{ val: "income", label: "Receita", color: "emerald" }, { val: "expense", label: "Despesa", color: "red" }].map((opt) => (
                <button key={opt.val} type="button" onClick={() => setForm((f) => ({ ...f, type: opt.val }))}
                  className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${form.type === opt.val ? (opt.val === "income" ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/20" : "bg-red-100 text-red-700 ring-2 ring-red-500/20") : "bg-surface-container-low text-on-surface-variant"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Descrição</label>
            <input type="text" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required placeholder="Ex: Balayage - Maria Silva" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Categoria</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary">
                {["Serviço", "Produto", "Aluguel", "Utilidades", "Salário", "Marketing", "Outros"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Valor (R$)</label>
              <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="0.01" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Método de Pagamento</label>
              <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary">
                {["Cartão", "PIX", "Dinheiro", "Transferência"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Data</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required />
            </div>
          </div>
          <button type="submit" className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition-all">
            Registrar
          </button>
        </form>
      </Modal>
    </>
  );
}
