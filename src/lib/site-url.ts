/**
 * URL do callback após confirmação de e-mail (Supabase Auth).
 *
 * - Em produção (qualquer host que não seja localhost): usa o próprio
 *   `window.location.origin` → o link do e-mail volta ao site certo mesmo se
 *   NEXT_PUBLIC_SITE_URL faltar na Vercel.
 * - Em localhost: se existir NEXT_PUBLIC_SITE_URL (ex.: URL da Vercel), usa essa
 *   URL para o e-mail redirecionar ao site publicado em vez de :3000.
 */
export function getAuthCallbackUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    let hostname = "";
    try {
      hostname = new URL(origin).hostname;
    } catch {
      hostname = "";
    }
    const isLocalhost =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".local");

    if (!isLocalhost) {
      return `${origin}/auth/callback`;
    }
    if (fromEnv) {
      return `${fromEnv}/auth/callback`;
    }
    return `${origin}/auth/callback`;
  }

  if (fromEnv) return `${fromEnv}/auth/callback`;
  return "http://localhost:3000/auth/callback";
}
