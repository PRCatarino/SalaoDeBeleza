/**
 * Supabase URL + chave pública.
 * Aceita anon (JWT) ou publishable (`sb_publishable_...`).
 */
function readUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

function readKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() ||
    undefined
  );
}

/** Para middleware na Vercel: nunca lançar (evita MIDDLEWARE_INVOCATION_FAILED). */
export function getSupabaseConfigOrNull(): { url: string; key: string } | null {
  const url = readUrl();
  const key = readKey();
  if (!url || !key) return null;
  return { url, key };
}

export function getSupabaseUrl(): string {
  const url = readUrl();
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  return url;
}

export function getSupabaseAnonKey(): string {
  const key = readKey();
  if (!key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    );
  }
  return key;
}
