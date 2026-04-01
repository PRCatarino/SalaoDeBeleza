"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAuthCallbackUrl } from "@/lib/site-url";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [salonName, setSalonName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("error") === "missing_env") {
      setError(
        "Variáveis do Supabase não configuradas no deploy. Na Vercel, em Environment Variables, defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY (ou ANON_KEY), depois faça Redeploy."
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();

    if (isSignUp) {
      const intentRes = await fetch("/api/auth/register-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const intentJson = (await intentRes.json().catch(() => ({}))) as {
        code?: string;
      };

      if (!intentRes.ok) {
        const code = intentJson.code;
        const byCode: Record<string, string> = {
          disposable_email:
            "E-mails temporários ou descartáveis não são aceitos. Use um e-mail corporativo ou pessoal válido.",
          rate_limit_email:
            "Este e-mail já teve várias tentativas de cadastro. Aguarde 24 horas ou use outro e-mail.",
          rate_limit_ip:
            "Muitas tentativas de cadastro nesta conexão. Aguarde 24 horas ou tente outra rede.",
          server_misconfigured:
            "Cadastro indisponível: configure SUPABASE_SERVICE_ROLE_KEY no servidor (Vercel).",
          invalid_email: "Informe um e-mail válido.",
        };
        setError(
          (code && byCode[code]) ||
            "Não foi possível iniciar o cadastro. Tente mais tarde."
        );
        setLoading(false);
        return;
      }

      const emailRedirectTo = getAuthCallbackUrl();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo,
          data: {
            full_name: fullName,
            salon_name: salonName || "Meu Salão",
          },
        },
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("rate limit")) {
          setError(
            "Limite de e-mails do provedor atingido. Aguarde cerca de 1 hora ou tente outro e-mail."
          );
        } else {
          setError(error.message);
        }
      } else {
        setMessage(
          "Conta criada! Verifique seu e-mail para confirmar o cadastro."
        );
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError("E-mail ou senha incorretos.");
      } else {
        router.push("/dashboard");
        return;
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center editorial-gradient p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      <main className="w-full max-w-[440px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-container mb-4 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-2xl">
              auto_awesome
            </span>
          </div>
          <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-background">
            Atelier Concierge
          </h1>
          <p className="text-on-surface-variant mt-2 text-sm tracking-wide uppercase">
            Gestão Premium para Salões
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 sm:p-8 md:p-10 shadow-[0_8px_32px_rgba(11,28,48,0.06)] relative overflow-hidden w-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary to-secondary opacity-80" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-on-surface transition-all"
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest">
                    Nome do Salão
                  </label>
                  <input
                    type="text"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-on-surface transition-all"
                    placeholder="Nome do seu salão"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-on-surface transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[0.6875rem] font-semibold text-on-surface-variant uppercase tracking-widest">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 px-4 bg-surface-container-low border-none rounded-lg focus:ring-2 focus:ring-primary text-on-surface transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {message && (
              <div className="p-3 bg-primary-fixed text-on-primary-fixed rounded-lg text-sm font-medium">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-linear-to-r from-primary to-primary-container text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {loading
                ? "Aguarde..."
                : isSignUp
                ? "Criar Conta"
                : "Entrar"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setMessage("");
              }}
              className="text-sm text-on-surface-variant hover:text-primary transition-colors py-2 min-h-[44px]"
            >
              {isSignUp
                ? "Já tem uma conta? Faça login"
                : "Não tem conta? Cadastre-se"}
            </button>
          </div>
        </div>
      </main>

      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary-fixed/20 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary-fixed/20 blur-[120px] rounded-full -z-10" />
    </div>
  );
}
