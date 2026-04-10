"use client";

import { useEffect, useState, useCallback } from "react";
import { salonRpc } from "@/lib/rpc-client";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { Professional } from "@/lib/types";

export default function TeamPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    role_title: "",
    email: "",
    phone: "",
    status: "active" as string,
    commission_type: "percentage" as string,
    commission_value: "",
    color: "#6d28d9",
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, totalBookings: 0 });

  const fetchData = useCallback(async () => {
    const { data } = await salonRpc("professionalsList");
    const pros = (data as Professional[]) || [];
    setProfessionals(pros);

    const active = pros.filter((p) => p.status === "active").length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const countRes = await salonRpc("professionalsAppointmentsMonthCount", { startOfMonth });
    const totalBookings = typeof countRes.data === "number" ? countRes.data : 0;

    setStats({ active, totalBookings });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingPro(null);
    setForm({
      full_name: "",
      role_title: "",
      email: "",
      phone: "",
      status: "active",
      commission_type: "percentage",
      commission_value: "",
      color: "#6d28d9",
    });
    setModalOpen(true);
  };

  const openEdit = (p: Professional) => {
    setEditingPro(p);
    setForm({
      full_name: p.full_name,
      role_title: p.role_title,
      email: p.email || "",
      phone: p.phone || "",
      status: p.status,
      commission_type: p.commission_type,
      commission_value: String(p.commission_value),
      color: p.color,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: form.full_name,
      role_title: form.role_title,
      email: form.email || null,
      phone: form.phone || null,
      status: form.status,
      commission_type: form.commission_type,
      commission_value: parseFloat(form.commission_value) || 0,
      color: form.color,
    };

    if (editingPro) {
      await salonRpc("professionalsUpdate", { id: editingPro.id, ...payload });
    } else {
      await salonRpc("professionalsInsert", payload);
    }

    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este profissional?")) return;
    await salonRpc("professionalsDelete", { id });
    fetchData();
  };

  const statusColor: Record<string, string> = {
    active: "bg-emerald-500",
    away: "bg-amber-500",
    inactive: "bg-slate-400",
  };

  const statusLabel: Record<string, string> = {
    active: "Ativo",
    away: "Ausente",
    inactive: "Inativo",
  };

  return (
    <>
      <TopNav title="Equipe" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0">
        <div className="mb-8 sm:mb-12 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl min-w-0">
            <span className="text-[0.6875rem] uppercase tracking-[0.2em] font-bold text-violet-700 mb-4 block">
              Nossos Profissionais
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-headline leading-tight text-on-background">
              Gestão de <span className="text-primary italic">Equipe</span>
            </h2>
          </div>
          <div className="flex gap-8 sm:gap-12 border-t-2 lg:border-t-0 lg:border-l-2 border-surface-container-high pt-6 lg:pt-0 lg:pl-8 pb-2 w-full lg:w-auto justify-between sm:justify-start">
            <div>
              <p className="text-4xl sm:text-[3.5rem] font-headline font-extrabold leading-none text-on-surface">
                {stats.active}
              </p>
              <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mt-2">
                Profissionais Ativos
              </p>
            </div>
            <div>
              <p className="text-4xl sm:text-[3.5rem] font-headline font-extrabold leading-none text-on-surface">
                {stats.totalBookings}
              </p>
              <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mt-2">
                Agendamentos no Mês
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-on-surface-variant">Carregando...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {professionals.map((pro) => (
              <div key={pro.id} className="group bg-white rounded-xl overflow-hidden hover:shadow-[0_20px_40px_rgba(11,28,48,0.08)] transition-all duration-300">
                <div className="relative h-32 overflow-hidden" style={{ backgroundColor: pro.color + "20" }}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-headline font-extrabold" style={{ color: pro.color + "30" }}>
                      {pro.full_name.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                    <span className={`w-2 h-2 rounded-full ${statusColor[pro.status]}`} />
                    <span className="text-[0.6875rem] font-bold uppercase tracking-wider text-slate-800">
                      {statusLabel[pro.status]}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold font-headline text-on-surface">{pro.full_name}</h3>
                      <p className="text-sm text-on-surface-variant font-medium">{pro.role_title}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
                        Comissão
                      </p>
                      <p className="text-xl font-headline font-bold text-violet-700">
                        {pro.commission_type === "percentage"
                          ? `${pro.commission_value}%`
                          : `R$ ${Number(pro.commission_value).toFixed(0)}`}
                      </p>
                    </div>
                    <div className="bg-surface-container-low p-3 rounded-lg">
                      <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mb-1">
                        Status
                      </p>
                      <p className="text-xl font-headline font-bold">{statusLabel[pro.status]}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(pro)}
                      className="flex-1 bg-surface-container-highest text-on-primary-fixed-variant py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:opacity-80 transition-all"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(pro.id)}
                      className="p-2.5 bg-surface-container-low text-on-surface-variant rounded-lg hover:bg-error-container hover:text-error transition-all"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div
              onClick={openCreate}
              className="group border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-12 hover:border-primary transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                <span className="material-symbols-outlined text-3xl">person_add</span>
              </div>
              <h3 className="text-lg font-bold font-headline text-on-surface-variant group-hover:text-primary transition-all">
                Adicionar Profissional
              </h3>
              <p className="text-sm text-on-surface-variant text-center mt-2 max-w-[200px]">
                Convide um novo profissional para sua equipe.
              </p>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPro ? "Editar Profissional" : "Novo Profissional"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Nome Completo</label>
            <input type="text" value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Cargo / Especialidade</label>
            <input type="text" value={form.role_title} onChange={(e) => setForm((f) => ({ ...f, role_title: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required placeholder="Ex: Cabeleireira, Manicure, Barbeiro" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Telefone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <span className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Comissão do colaborador
            </span>
            <div className="flex rounded-xl bg-surface-container-highest p-1 gap-1 mb-3">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, commission_type: "percentage" }))}
                className={`flex-1 h-11 rounded-lg text-sm font-bold transition-all ${
                  form.commission_type === "percentage"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Percentual (%)
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, commission_type: "fixed" }))}
                className={`flex-1 h-11 rounded-lg text-sm font-bold transition-all ${
                  form.commission_type === "fixed"
                    ? "bg-white text-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Valor fixo (R$)
              </button>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                {form.commission_type === "percentage" ? "Percentual sobre o serviço" : "Valor fixo por atendimento"}
              </label>
              <div className="relative">
                {form.commission_type === "fixed" ? (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                    R$
                  </span>
                ) : null}
                <input
                  type="number"
                  step={form.commission_type === "percentage" ? "0.1" : "0.01"}
                  min="0"
                  max={form.commission_type === "percentage" ? "100" : undefined}
                  value={form.commission_value}
                  onChange={(e) => setForm((f) => ({ ...f, commission_value: e.target.value }))}
                  className={`w-full h-12 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary ${
                    form.commission_type === "fixed" ? "pl-12 pr-4" : "px-4 pr-11"
                  }`}
                  placeholder={form.commission_type === "percentage" ? "Ex: 40" : "25,00"}
                />
                {form.commission_type === "percentage" ? (
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-on-surface-variant">
                    %
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary">
              <option value="active">Ativo</option>
              <option value="away">Ausente</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Cor</label>
            <input type="color" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="w-12 h-12 rounded-lg cursor-pointer border-none" />
          </div>
          <button type="submit" className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition-all">
            {editingPro ? "Salvar" : "Adicionar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
