"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { Service, ServiceCategory } from "@/lib/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    duration_minutes: "60",
    price: "",
    description: "",
    online_booking: true,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const [svcRes, catRes] = await Promise.all([
      supabase.from("services").select("*, category:service_categories(*)").order("name"),
      supabase.from("service_categories").select("*").order("name"),
    ]);
    setServices((svcRes.data as Service[]) || []);
    setCategories(catRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingService(null);
    setForm({ name: "", category_id: "", duration_minutes: "60", price: "", description: "", online_booking: true });
    setModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setForm({
      name: s.name,
      category_id: s.category_id || "",
      duration_minutes: String(s.duration_minutes),
      price: String(s.price),
      description: s.description || "",
      online_booking: s.online_booking,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      duration_minutes: parseInt(form.duration_minutes),
      price: parseFloat(form.price),
      description: form.description || null,
      online_booking: form.online_booking,
    };

    if (editingService) {
      await supabase.from("services").update(payload).eq("id", editingService.id);
    } else {
      await supabase.from("services").insert(payload);
    }

    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este serviço?")) return;
    const supabase = createClient();
    await supabase.from("services").delete().eq("id", id);
    fetchData();
  };

  const toggleBooking = async (id: string, current: boolean) => {
    const supabase = createClient();
    await supabase.from("services").update({ online_booking: !current }).eq("id", id);
    fetchData();
  };

  const filtered = activeFilter === "all"
    ? services
    : services.filter((s) => s.category_id === activeFilter);

  const formatDuration = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return h > 0 ? `${h}h ${min > 0 ? `${min}m` : ""}` : `${min}m`;
  };

  const catColorMap: Record<string, string> = {
    Cabelo: "text-primary bg-primary-fixed",
    Unhas: "text-emerald-700 bg-emerald-100",
    Estética: "text-secondary bg-secondary-fixed",
    Massagem: "text-tertiary-container bg-tertiary-fixed",
    Barba: "text-amber-700 bg-amber-100",
  };

  return (
    <>
      <TopNav title="Serviços" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="min-w-0">
            <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Menu de Serviços
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg">
              Gerencie os serviços oferecidos pelo seu salão.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-primary to-primary-container text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all w-full md:w-auto shrink-0"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Novo Serviço
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-primary text-white shadow-md"
                : "bg-white text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === cat.id
                  ? "bg-primary text-white shadow-md"
                  : "bg-white text-on-surface-variant hover:bg-surface-container-highest"
              }`}
            >
              {cat.name}
            </button>
          ))}
          <div className="w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2 text-on-surface-variant pt-1 sm:pt-0">
            <span className="text-xs uppercase tracking-widest font-bold">Total:</span>
            <span className="text-sm font-semibold text-primary">{filtered.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-on-surface-variant">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">content_cut</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Nenhum serviço encontrado</h3>
            <p className="text-on-surface-variant mb-8">Clique em &quot;Novo Serviço&quot; para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((svc) => {
              const catName = svc.category?.name || "Geral";
              const colorClass = catColorMap[catName] || "text-slate-700 bg-slate-100";
              return (
                <div key={svc.id} className="group bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(11,28,48,0.03)] border border-transparent hover:border-primary-fixed-dim transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[0.6875rem] uppercase tracking-widest font-bold px-2 py-1 rounded ${colorClass}`}>
                      {catName}
                    </span>
                    <div className="flex gap-1">
                      <button type="button" onClick={() => openEdit(svc)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed transition-colors rounded-lg">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button type="button" onClick={() => handleDelete(svc.id)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-outline hover:text-error hover:bg-error-container transition-colors rounded-lg">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                  <h3 className="font-headline text-xl font-bold text-on-surface mb-4">{svc.name}</h3>
                  <div className="flex items-center gap-6 mb-6 py-4 border-y border-surface-container">
                    <div className="flex flex-col">
                      <span className="text-[0.625rem] uppercase tracking-tighter text-outline-variant font-bold">Duração</span>
                      <span className="text-sm font-semibold text-on-surface">{formatDuration(svc.duration_minutes)}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[0.625rem] uppercase tracking-tighter text-outline-variant font-bold">Preço</span>
                      <span className="text-sm font-bold text-on-surface">
                        R$ {Number(svc.price).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[0.6875rem] font-medium text-on-surface-variant">Agendamento Online</span>
                    <button
                      type="button"
                      onClick={() => toggleBooking(svc.id, svc.online_booking)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        svc.online_booking ? "bg-primary" : "bg-surface-container-highest"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${svc.online_booking ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="p-6 sm:p-8 bg-surface-container rounded-3xl">
            <p className="text-[0.6875rem] uppercase tracking-widest font-black text-primary mb-4">Total de Serviços</p>
            <h4 className="font-headline text-4xl sm:text-5xl font-extrabold text-on-surface mb-2">{services.length}</h4>
            <p className="text-on-surface-variant font-medium">serviços cadastrados</p>
          </div>
          <div className="p-6 sm:p-8 bg-surface-container-high rounded-3xl">
            <p className="text-[0.6875rem] uppercase tracking-widest font-black text-secondary mb-4">Booking Online</p>
            <h4 className="font-headline text-4xl sm:text-5xl font-extrabold text-on-surface mb-2">
              {services.filter((s) => s.online_booking).length}
            </h4>
            <p className="text-on-surface-variant font-medium">disponíveis para agendamento</p>
          </div>
          <div className="p-6 sm:p-8 bg-primary text-on-primary-container rounded-3xl">
            <p className="text-[0.6875rem] uppercase tracking-widest font-black text-white mb-4">Categorias</p>
            <h4 className="font-headline text-4xl sm:text-5xl font-extrabold text-white mb-2">{categories.length}</h4>
            <p className="text-white/80 font-medium">categorias ativas</p>
          </div>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingService ? "Editar Serviço" : "Novo Serviço"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Nome</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Categoria</label>
            <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary">
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Duração (min)</label>
              <input type="number" value={form.duration_minutes} onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="5" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Preço (R$)</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary" required min="0" />
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary resize-none" rows={2} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.online_booking} onChange={(e) => setForm((f) => ({ ...f, online_booking: e.target.checked }))} className="rounded text-primary focus:ring-primary h-5 w-5" />
            <span className="text-sm font-medium text-on-surface">Disponível para agendamento online</span>
          </label>
          <button type="submit" className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition-all">
            {editingService ? "Salvar" : "Criar Serviço"}
          </button>
        </form>
      </Modal>
    </>
  );
}
