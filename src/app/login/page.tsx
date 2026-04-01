"use client";

import { useState, useEffect } from "react";
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
    if (p.get("error") === "missing_auth_secret") {
      setError(
        "Na Vercel: Project → Settings → Environment Variables. Adicione AUTH_SECRET (mín. 32 caracteres) e DATABASE_URL para Production (e Preview se usar). Guarde e faça Redeploy. Localmente use .env.local."
      );
      p.delete("error");
      const qs = p.toString();
      window.history.replaceState(
        {},
        "",
        qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      );
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

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
            "Cadastro indisponível: configure DATABASE_URL no servidor.",
          db_unreachable:
            "Sem ligação ao PostgreSQL. Verifique se o servidor de BD está acessível e se DATABASE_URL está correto.",
          db_auth_failed:
            "A password na DATABASE_URL não bate com o utilizador salao_app no Postgres. Na VPS rode ALTER ROLE salao_app PASSWORD 'sua_senha'; e use a mesma na URL (caracteres especiais em percent-encoding, ex.: $ → %24).",
          invalid_email: "Informe um e-mail válido.",
        };
        setError(
          (code && byCode[code]) ||
            "Não foi possível iniciar o cadastro. Tente mais tarde."
        );
        setLoading(false);
        return;
      }

      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          fullName: fullName.trim(),
          salonName: (salonName || "Meu Salão").trim(),
        }),
      });
      if (!regRes.ok) {
        if (regRes.status === 409) {
          setError("Já existe conta com este e-mail. Faça login.");
        } else {
          const j = (await regRes.json().catch(() => ({}))) as { error?: string };
          setError(
            j.error === "invalid"
              ? "Dados inválidos. Use senha com pelo menos 6 caracteres."
              : j.error === "db_unreachable"
                ? "Sem ligação ao PostgreSQL."
                : j.error === "db_auth_failed"
                  ? "DATABASE_URL: utilizador ou password incorretos no Postgres."
                  : "Não foi possível criar a conta."
          );
        }
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      return;
    } else {
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      if (!loginRes.ok) {
        if (loginRes.status === 503) {
          const j = (await loginRes.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(
            j.error === "db_auth_failed"
              ? "DATABASE_URL: password do Postgres (salao_app) incorreta. Alinhe com ALTER ROLE na VPS."
              : "Sem ligação ao PostgreSQL. Verifique DATABASE_URL."
          );
        } else {
          setError("E-mail ou senha incorretos.");
        }
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
