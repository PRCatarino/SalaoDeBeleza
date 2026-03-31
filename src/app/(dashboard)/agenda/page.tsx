"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";
import Modal from "@/components/Modal";
import type { Appointment, Professional, Service, Client } from "@/lib/types";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "",
    professional_id: "",
    service_id: "",
    start_hour: "09",
    start_minute: "00",
    notes: "",
    newClientName: "",
    newClientPhone: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const dayStart = `${selectedDate}T00:00:00`;
    const dayEnd = `${selectedDate}T23:59:59`;

    const [proRes, aptRes, svcRes, cliRes] = await Promise.all([
      supabase.from("professionals").select("*").eq("status", "active").order("full_name"),
      supabase
        .from("appointments")
        .select("*, client:clients(*), professional:professionals(*), service:services(*)")
        .gte("start_time", dayStart)
        .lte("start_time", dayEnd)
        .neq("status", "cancelled")
        .order("start_time"),
      supabase.from("services").select("*").eq("active", true).order("name"),
      supabase.from("clients").select("*").order("full_name"),
    ]);

    setProfessionals(proRes.data || []);
    setAppointments((aptRes.data as Appointment[]) || []);
    setServices(svcRes.data || []);
    setClients(cliRes.data || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();

    let clientId = form.client_id;

    if (!clientId && form.newClientName) {
      const { data } = await supabase
        .from("clients")
        .insert({ full_name: form.newClientName, phone: form.newClientPhone || null })
        .select()
        .single();
      if (data) clientId = data.id;
    }

    if (!clientId || !form.professional_id || !form.service_id) return;

    const service = services.find((s) => s.id === form.service_id);
    const startTime = new Date(`${selectedDate}T${form.start_hour}:${form.start_minute}:00`);
    const endTime = new Date(startTime.getTime() + (service?.duration_minutes || 60) * 60000);

    await supabase.from("appointments").insert({
      client_id: clientId,
      professional_id: form.professional_id,
      service_id: form.service_id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      status: "confirmed",
      price: service?.price || 0,
      notes: form.notes || null,
    });

    setModalOpen(false);
    setForm({
      client_id: "",
      professional_id: "",
      service_id: "",
      start_hour: "09",
      start_minute: "00",
      notes: "",
      newClientName: "",
      newClientPhone: "",
    });
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClient();
    await supabase.from("appointments").update({ status }).eq("id", id);

    if (status === "completed") {
      const apt = appointments.find((a) => a.id === id);
      if (apt) {
        await supabase.from("transactions").insert({
          type: "income",
          category: "Serviço",
          description: `${apt.service?.name || "Serviço"} - ${apt.client?.full_name || "Cliente"}`,
          amount: apt.price,
          payment_method: "Cartão",
          appointment_id: id,
          date: new Date().toISOString(),
        });
      }
    }
    fetchData();
  };

  const getAppointmentsForSlot = (proId: string, hour: number) =>
    appointments.filter((a) => {
      if (a.professional_id !== proId) return false;
      const h = new Date(a.start_time).getHours();
      return h === hour;
    });

  const colors = ["violet", "emerald", "amber", "blue", "rose", "teal"];

  return (
    <>
      <TopNav title="Agenda" />
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary"
            />
            <span className="text-sm text-on-surface-variant font-medium">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-primary-container text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Novo Agendamento
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-on-surface-variant">Carregando...</p>
          </div>
        ) : professionals.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant mb-4 block">
              group_add
            </span>
            <h3 className="text-xl font-bold font-headline mb-2">Nenhum profissional cadastrado</h3>
            <p className="text-on-surface-variant">
              Cadastre profissionais na aba &quot;Equipe&quot; para começar a agendar.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(11,28,48,0.06)] overflow-hidden border border-surface-container-high">
            <div className="grid border-b border-surface-container-high bg-white" style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}>
              <div className="border-r border-surface-container-high flex items-center justify-center p-4">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Hora</span>
              </div>
              {professionals.map((pro, i) => (
                <div key={pro.id} className="p-4 flex flex-col items-center gap-1 border-r border-surface-container-high last:border-r-0">
                  <div className={`w-8 h-8 rounded-full bg-${colors[i % colors.length]}-100 flex items-center justify-center font-bold text-${colors[i % colors.length]}-700 text-xs`}>
                    {pro.full_name.charAt(0)}
                  </div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">{pro.role_title}</p>
                  <p className="text-sm font-bold">{pro.full_name.split(" ")[0]}</p>
                </div>
              ))}
            </div>

            <div className="overflow-y-auto custom-scrollbar max-h-[600px]">
              {HOURS.map((hour) => (
                <div key={hour} className="grid border-b border-surface-container-high/50" style={{ gridTemplateColumns: `80px repeat(${professionals.length}, 1fr)` }}>
                  <div className="border-r border-surface-container-high flex items-start justify-center pt-2 h-20">
                    <span className="text-[10px] font-bold text-on-surface-variant">
                      {String(hour).padStart(2, "0")}:00
                    </span>
                  </div>
                  {professionals.map((pro, pIdx) => {
                    const slotApts = getAppointmentsForSlot(pro.id, hour);
                    const color = colors[pIdx % colors.length];
                    return (
                      <div key={pro.id} className="border-r border-surface-container-high/50 last:border-r-0 h-20 p-1">
                        {slotApts.length > 0 ? (
                          slotApts.map((apt) => (
                            <div
                              key={apt.id}
                              className={`h-full w-full bg-${color}-50 border-l-4 border-${color}-500 rounded-lg p-2 text-xs flex flex-col justify-between`}
                            >
                              <div>
                                <p className={`font-bold text-${color}-700`}>
                                  {apt.service?.name || "Serviço"}
                                </p>
                                <p className="text-[10px] text-on-surface-variant">
                                  {apt.client?.full_name || "Cliente"}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 mt-auto">
                                <span className="text-[9px] font-bold bg-white/50 px-1 rounded">
                                  {new Date(apt.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {apt.status === "confirmed" && (
                                  <button
                                    onClick={() => updateStatus(apt.id, "completed")}
                                    className="ml-auto text-emerald-600 hover:text-emerald-800"
                                    title="Marcar como concluído"
                                  >
                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                  </button>
                                )}
                                {apt.status !== "cancelled" && apt.status !== "completed" && (
                                  <button
                                    onClick={() => updateStatus(apt.id, "cancelled")}
                                    className="text-red-400 hover:text-red-600"
                                    title="Cancelar"
                                  >
                                    <span className="material-symbols-outlined text-sm">cancel</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div
                            onClick={() => {
                              setForm((f) => ({
                                ...f,
                                professional_id: pro.id,
                                start_hour: String(hour).padStart(2, "0"),
                              }));
                              setModalOpen(true);
                            }}
                            className="h-full w-full flex items-center justify-center cursor-pointer hover:bg-surface-container-low/50 rounded-lg group"
                          >
                            <span className="material-symbols-outlined text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity">
                              add
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Agendamento">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Cliente Existente
            </label>
            <select
              value={form.client_id}
              onChange={(e) => setForm((f) => ({ ...f, client_id: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Novo cliente --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          {!form.client_id && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={form.newClientName}
                  onChange={(e) => setForm((f) => ({ ...f, newClientName: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                  required={!form.client_id}
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                  Telefone
                </label>
                <input
                  type="text"
                  value={form.newClientPhone}
                  onChange={(e) => setForm((f) => ({ ...f, newClientPhone: e.target.value }))}
                  className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Profissional
            </label>
            <select
              value={form.professional_id}
              onChange={(e) => setForm((f) => ({ ...f, professional_id: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} - {p.role_title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Serviço
            </label>
            <select
              value={form.service_id}
              onChange={(e) => setForm((f) => ({ ...f, service_id: e.target.value }))}
              className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              required
            >
              <option value="">Selecione...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} - R$ {Number(s.price).toFixed(2)} ({s.duration_minutes}min)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Hora
              </label>
              <select
                value={form.start_hour}
                onChange={(e) => setForm((f) => ({ ...f, start_hour: e.target.value }))}
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              >
                {HOURS.map((h) => (
                  <option key={h} value={String(h).padStart(2, "0")}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
                Minuto
              </label>
              <select
                value={form.start_minute}
                onChange={(e) => setForm((f) => ({ ...f, start_minute: e.target.value }))}
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              >
                {["00", "15", "30", "45"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-2">
              Observações
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary resize-none"
              rows={2}
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
          >
            Agendar
          </button>
        </form>
      </Modal>
    </>
  );
}
