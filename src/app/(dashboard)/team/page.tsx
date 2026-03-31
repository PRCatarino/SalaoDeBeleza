"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
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
    const supabase = createClient();
    const { data } = await supabase.from("professionals").select("*").order("full_name");
    const pros = data || [];
    setProfessionals(pros);

    const active = pros.filter((p) => p.status === "active").length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count } = await supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("start_time", startOfMonth);

    setStats({ active, totalBookings: count || 0 });
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
    const supabase = createClient();
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
      await supabase.from("professionals").update(payload).eq("id", editingPro.id);
    } else {
      await supabase.from("professionals").insert(payload);
    }

    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este profissional?")) return;
    const supabase = createClient();
    await supabase.from("professionals").delete().eq("id", id);
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
      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row items-end justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-[0.6875rem] uppercase tracking-[0.2em] font-bold text-violet-700 mb-4 block">
              Nossos Profissionais
            </span>
            <h2 className="text-5xl font-extrabold font-headline leading-tight text-on-background">
              Gestão de <span className="text-primary italic">Equipe</span>
            </h2>
          </div>
          <div className="flex gap-12 border-l-2 border-surface-container-high pl-8 pb-2">
            <div>
              <p className="text-[3.5rem] font-headline font-extrabold leading-none text-on-surface">
                {stats.active}
              </p>
              <p className="text-[0.6875rem] uppercase tracking-widest text-on-surface-variant font-bold mt-2">
                Profissionais Ativos
              </p>
            </div>
            <div>
              <p className="text-[3.5rem] font-headline font-extrabold leading-none text-on-surface">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Telefone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Tipo de Comissão</label>
              <select value={form.commission_type} onChange={(e) => setForm((f) => ({ ...f, commission_type: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary">
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Valor</label>
              <input type="number" step="0.01" value={form.commission_value} onChange={(e) => setForm((f) => ({ ...f, commission_value: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" />
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
