/**
 * URL do callback após confirmação de e-mail (Supabase Auth).
 * 1) NEXT_PUBLIC_SITE_URL na Vercel = sempre o domínio certo no link do e-mail.
 * 2) Senão, origem do navegador (cadastro no mesmo host).
 */
export function getAuthCallbackUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/auth/callback`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:3000/auth/callback";
}
