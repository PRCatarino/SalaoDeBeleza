"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import TopNav from "@/components/TopNav";
import type { Profile } from "@/lib/types";
import Image from "next/image";

const emptyForm = {
  full_name: "",
  salon_name: "",
  salon_address: "",
  store_description: "",
  cnpj: "",
  owner_cpf: "",
  store_phone: "",
  store_email: "",
  avatar_url: "",
};

export default function ProfilePage() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setUserId(user.id);

    const { data: row, error: qErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (qErr) {
      setError(qErr.message);
      setLoading(false);
      return;
    }

    if (row) {
      const p = row as Profile;
      setForm({
        full_name: p.full_name || "",
        salon_name: p.salon_name || "",
        salon_address: p.salon_address || "",
        store_description: p.store_description || "",
        cnpj: p.cnpj || "",
        owner_cpf: p.owner_cpf || "",
        store_phone: p.store_phone || "",
        store_email: p.store_email || "",
        avatar_url: p.avatar_url || "",
      });
    } else {
      setForm({
        ...emptyForm,
        full_name:
          (user.user_metadata?.full_name as string) ||
          user.email?.split("@")[0] ||
          "",
        salon_name:
          (user.user_metadata?.salon_name as string) || "Meu Salão",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setError("");
    const supabase = createClient();
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setError(
        `Upload falhou: ${upErr.message}. Crie o bucket "avatars" e as políticas (veja supabase/migration_profile_store.sql) ou use URL abaixo.`
      );
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: pub.publicUrl }));
    setMessage("Foto enviada. Clique em Salvar alterações.");
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    setError("");
    setMessage("");
    const supabase = createClient();

    const payload = {
      id: userId,
      full_name: form.full_name.trim() || "Usuário",
      salon_name: form.salon_name.trim() || "Meu Salão",
      salon_address: form.salon_address.trim() || null,
      store_description: form.store_description.trim() || null,
      cnpj: form.cnpj.replace(/\D/g, "") || null,
      owner_cpf: form.owner_cpf.replace(/\D/g, "") || null,
      store_phone: form.store_phone.trim() || null,
      store_email: form.store_email.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    };

    const { data: exists } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    let saveErr;
    if (exists) {
      const rest = { ...payload };
      delete (rest as { id?: string }).id;
      const r = await supabase.from("profiles").update(rest).eq("id", userId);
      saveErr = r.error;
    } else {
      const r = await supabase.from("profiles").insert(payload);
      saveErr = r.error;
    }

    setSaving(false);
    if (saveErr) {
      setError(saveErr.message);
      return;
    }
    setMessage("Dados salvos com sucesso.");
    await load();
  };

  if (loading) {
    return (
      <>
        <TopNav title="Perfil e Loja" />
        <div className="p-4 sm:p-6 md:p-8 text-on-surface-variant">Carregando perfil…</div>
      </>
    );
  }

  return (
    <>
      <TopNav title="Perfil e Loja" />
      <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto min-w-0">
        <div className="mb-8">
          <h2 className="text-2xl font-headline font-extrabold text-on-background">
            Seu perfil e dados da loja
          </h2>
          <p className="text-on-surface-variant mt-1 text-sm">
            Informações de localização, documentos e contato aparecem só para sua
            equipe (dados reais no Supabase).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(11,28,48,0.04)] border border-outline-variant/10 p-4 sm:p-6 md:p-8 space-y-6"
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="flex flex-col items-center gap-3">
              <div className="w-24 h-24 rounded-2xl bg-surface-container-low overflow-hidden flex items-center justify-center text-3xl font-headline font-bold text-primary border border-outline-variant/20">
                {form.avatar_url ? (
                  <Image
                    src={form.avatar_url}
                    alt="Perfil"
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                ) : (
                  (form.full_name || "?").charAt(0).toUpperCase()
                )}
              </div>
              <label className="text-xs font-bold text-primary cursor-pointer hover:underline">
                Enviar foto
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </label>
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  URL da foto (opcional)
    </label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, avatar_url: e.target.value }))
                  }
                  className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-sm"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                Nome do responsável
              </label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                CPF do responsável
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.owner_cpf}
                onChange={(e) =>
                  setForm((f) => ({ ...f, owner_cpf: e.target.value }))
                }
                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <h3 className="font-headline font-bold text-on-background">
              Loja
            </h3>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                Nome da loja
              </label>
              <input
                type="text"
                required
                value={form.salon_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, salon_name: e.target.value }))
                }
                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                CNPJ
              </label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) =>
                  setForm((f) => ({ ...f, cnpj: e.target.value }))
                }
                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                Localização / endereço
              </label>
              <input
                type="text"
                value={form.salon_address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, salon_address: e.target.value }))
                }
                className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                placeholder="Rua, número, bairro, cidade…"
              />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                Informações da loja
              </label>
              <textarea
                value={form.store_description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, store_description: e.target.value }))
                }
                rows={4}
                className="w-full px-4 py-3 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary resize-none text-sm"
                placeholder="Horário, diferenciais, redes sociais, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  Contato da loja (telefone)
                </label>
                <input
                  type="tel"
                  value={form.store_phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, store_phone: e.target.value }))
                  }
                  className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest mb-1.5">
                  E-mail da loja
                </label>
                <input
                  type="email"
                  value={form.store_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, store_email: e.target.value }))
                  }
                  className="w-full h-11 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-lg bg-primary-fixed text-on-primary-fixed text-sm font-medium">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-8 h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-xl shadow-lg active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>
      </div>
    </>
  );
}
