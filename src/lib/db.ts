import postgres from "postgres";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SqlClient = postgres.Sql<any>;

declare global {
  // eslint-disable-next-line no-var
  var __salao_pg: SqlClient | undefined;
  /** Última URL usada para criar o cliente (dev: sem isto, hot reload mantinha credenciais antigas). */
  // eslint-disable-next-line no-var
  var __salao_pg_url: string | undefined;
}

/** Evita erro se no .env ficou `DATABASE_URL=DATABASE_URL=postgresql://...` por copy-paste. */
function normalizeDatabaseUrl(raw: string): string {
  let u = raw.trim();
  while (u.startsWith("DATABASE_URL=")) {
    u = u.slice("DATABASE_URL=".length).trim();
  }
  return u;
}

/** TLS: obrigatório na Neon, Supabase, etc. Desligue com DATABASE_SSL=false em Postgres local sem SSL. */
function shouldUseSsl(url: string): boolean {
  const explicit = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (explicit === "false" || explicit === "0") return false;
  if (explicit === "require" || explicit === "true" || explicit === "1") return true;
  const u = url.toLowerCase();
  if (u.includes("sslmode=require") || u.includes("sslmode=verify-full")) return true;
  return (
    u.includes(".neon.tech") ||
    u.includes(".pooler.supabase.com") ||
    u.includes(".supabase.co")
  );
}

/**
 * Pooler Supabase (porta 6543 / host pooler) usa modo transação — prepared statements quebram.
 * @see https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
 */
function shouldDisablePrepare(url: string): boolean {
  const u = url.toLowerCase();
  return u.includes("pooler.supabase.com") || u.includes(":6543/");
}

function connectionPoolMax(): number {
  const raw = process.env.DATABASE_POOL_MAX?.trim();
  if (raw && /^\d+$/.test(raw)) {
    return Math.min(20, Math.max(1, parseInt(raw, 10)));
  }
  return process.env.VERCEL ? 1 : 12;
}

export function getSql(): SqlClient {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is required");
  }
  const url = normalizeDatabaseUrl(raw);

  if (!globalThis.__salao_pg || globalThis.__salao_pg_url !== url) {
    const prev = globalThis.__salao_pg;
    const opts: Parameters<typeof postgres>[1] = {
      max: connectionPoolMax(),
      connect_timeout: process.env.VERCEL ? 15 : 30,
    };
    if (shouldUseSsl(url)) opts.ssl = "require";
    if (shouldDisablePrepare(url)) opts.prepare = false;

    globalThis.__salao_pg = postgres(url, opts) as SqlClient;
    globalThis.__salao_pg_url = url;
    if (prev) {
      void prev.end({ timeout: 5 });
    }
  }
  return globalThis.__salao_pg;
}

export function txSql(tx: unknown): SqlClient {
  return tx as SqlClient;
}
