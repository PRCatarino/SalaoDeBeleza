/**
 * Supabase URL + chave pública.
 * Aceita anon (JWT) ou publishable (`sb_publishable_...`).
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url?.trim()) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required");
  }
  return url.trim();
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim();
  if (!key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY"
    );
  }
  return key;
}
