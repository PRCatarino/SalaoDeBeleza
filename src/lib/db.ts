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

export function getSql(): SqlClient {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error("DATABASE_URL is required");
  }
  const url = normalizeDatabaseUrl(raw);

  if (!globalThis.__salao_pg || globalThis.__salao_pg_url !== url) {
    const prev = globalThis.__salao_pg;
    globalThis.__salao_pg = postgres(url, { max: 12 }) as SqlClient;
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
