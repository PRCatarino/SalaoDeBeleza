"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { salonRpc } from "@/lib/rpc-client";
import { clientFieldErrorMessage } from "@/lib/client-form-errors";
import { formatCpfDisplay, normalizeCpf } from "@/lib/cpf";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { Client } from "@/lib/types";

function formatBirthPt(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return isoDate;
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    cpf: "",
    birth_date: "",
    notes: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await salonRpc("clientsList");
    setClients((res.data as Client[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    if (!q) return clients;
    return clients.filter((c) => {
      const cpfDigits = normalizeCpf(c.cpf || "");
      return (
        c.full_name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        c.phone.toLowerCase().includes(q) ||
        (qDigits.length >= 3 && cpfDigits.includes(qDigits))
      );
    });
  }, [clients, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      full_name: "",
      email: "",
      phone: "",
      cpf: "",
      birth_date: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditing(c);
    setForm({
      full_name: c.full_name,
      email: c.email || "",
      phone: c.phone || "",
      cpf: formatCpfDisplay(c.cpf || ""),
      birth_date: (c.birth_date || "").slice(0, 10),
      notes: c.notes || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim(),
      cpf: normalizeCpf(form.cpf),
      birth_date: form.birth_date,
      notes: form.notes.trim() || null,
    };
    try {
      if (editing) {
        await salonRpc("clientsUpdate", { id: editing.id, ...payload });
      } else {
        await salonRpc("clientsInsert", payload);
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      alert(clientFieldErrorMessage(code));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este cliente? Agendamentos antigos podem ficar sem vínculo.")) return;
    await salonRpc("clientsDelete", { id });
    fetchData();
  };

  return (
    <>
      <TopNav title="Clientes" />
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto min-w-0">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="min-w-0">
            <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-2">
              Gerenciar clientes
            </h1>
            <p className="text-on-surface-variant text-base sm:text-lg">
              Cadastre, edite e organize a base de clientes do salão. Telefone, CPF e data de nascimento são obrigatórios.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 bg-linear-to-br from-primary to-primary-container text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all w-full md:w-auto shrink-0"
          >
            <span className="material-symbols-outlined">person_add</span>
            Novo cliente
          </button>
        </div>

        <div className="mb-8">
          <label className="sr-only" htmlFor="client-search">
            Buscar cliente
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
              search
            </span>
            <input
              id="client-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone ou CPF…"
              className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-on-surface-variant">Carregando...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-4">groups</span>
            <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">
              {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum resultado"}
            </h3>
            <p className="text-on-surface-variant mb-8 text-center max-w-md px-4">
              {clients.length === 0
                ? "Adicione clientes aqui ou ao criar um agendamento na agenda."
                : "Tente outro termo de busca."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="group bg-white p-6 rounded-xl shadow-[0_4px_20px_rgba(11,28,48,0.03)] border border-transparent hover:border-primary-fixed-dim transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-fixed text-primary-fixed-dim font-headline font-extrabold text-lg shrink-0">
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-outline hover:text-primary hover:bg-primary-fixed transition-colors rounded-lg"
                      aria-label={`Editar ${c.full_name}`}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-outline hover:text-error hover:bg-error-container transition-colors rounded-lg"
                      aria-label={`Remover ${c.full_name}`}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface mb-3">{c.full_name}</h3>
                <div className="space-y-2 text-sm text-on-surface-variant">
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-outline">call</span>
                    {c.phone}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-outline">id_card</span>
                    {formatCpfDisplay(c.cpf || "")}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-outline">cake</span>
                    {c.birth_date ? formatBirthPt(c.birth_date.slice(0, 10)) : "—"}
                  </p>
                  {c.email ? (
                    <p className="flex items-center gap-2 break-all">
                      <span className="material-symbols-outlined text-lg text-outline shrink-0">mail</span>
                      {c.email}
                    </p>
                  ) : null}
                  {c.notes ? (
                    <p className="pt-2 border-t border-surface-container text-on-surface-variant line-clamp-3">{c.notes}</p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 sm:mt-16 p-6 sm:p-8 bg-surface-container rounded-3xl max-w-xl">
          <p className="text-[0.6875rem] uppercase tracking-widest font-black text-primary mb-2">Total</p>
          <h4 className="font-headline text-4xl sm:text-5xl font-extrabold text-on-surface">{clients.length}</h4>
          <p className="text-on-surface-variant font-medium mt-1">clientes na base</p>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Editar cliente" : "Novo cliente"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Nome completo <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Telefone <span className="text-error">*</span>
              </label>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                required
                placeholder="(11) 99999-0000"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                CPF <span className="text-error">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={form.cpf}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    cpf: formatCpfDisplay(normalizeCpf(e.target.value)),
                  }))
                }
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                required
                maxLength={14}
                placeholder="000.000.000-00"
              />
            </div>
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Data de nascimento <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              placeholder="Preferências, alergias, histórico…"
            />
          </div>
          <button
            type="submit"
            className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md active:scale-[0.98] transition-all"
          >
            {editing ? "Salvar" : "Cadastrar"}
          </button>
        </form>
      </Modal>
    </>
  );
}
