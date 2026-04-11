/** Código SQLSTATE do Postgres (ex.: 42703, 28P01). */
export function pgErrorCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: unknown }).code;
    if (typeof c === "string" && c.length >= 4) return c;
  }
  return undefined;
}

/**
 * Schema do banco mais antigo que o app (falta migration) ou tabela errada.
 * Ex.: coluna `cpf` em `clients` após update do código sem rodar SQL.
 */
export function isPgSchemaMismatchError(e: unknown): boolean {
  const c = pgErrorCode(e);
  if (c === "42703" || c === "42P01") {
    return true;
  }
  const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
  if (msg.includes("does not exist")) {
    if (msg.includes("column") || msg.includes("relation")) return true;
  }
  return false;
}

/** Problema de TLS (URL sem SSL apontando para host que exige, ou vice-versa). */
export function isPgSslHandshakeProblem(e: unknown): boolean {
  const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
  return (
    msg.includes("wrong version number") ||
    msg.includes("ssl3_get_record") ||
    msg.includes("tlsv1_alert") ||
    msg.includes("certificate verify failed") ||
    msg.includes("self signed certificate") ||
    msg.includes("no pg_hba.conf entry")
  );
}

/** PostgreSQL FATAL: password authentication failed (28P01). */
export function isPgPasswordAuthFailed(e: unknown): boolean {
  if (e && typeof e === "object" && "code" in e) {
    return String((e as { code: unknown }).code) === "28P01";
  }
  const msg = String((e as Error)?.message ?? e ?? "").toLowerCase();
  return (
    msg.includes("password authentication failed") ||
    msg.includes("28p01")
  );
}

export function isDbConnectionRefused(e: unknown): boolean {
  const walk = (x: unknown): boolean => {
    if (!x || typeof x !== "object") return false;
    const err = x as NodeJS.ErrnoException & { cause?: unknown };
    const c = err.code;
    if (
      c === "ECONNREFUSED" ||
      c === "ETIMEDOUT" ||
      c === "ENOTFOUND" ||
      c === "EHOSTUNREACH" ||
      c === "ECONNRESET"
    ) {
      return true;
    }
    const msg = String((err as Error).message ?? "").toLowerCase();
    if (
      msg.includes("econnrefused") ||
      msg.includes("connect timeout") ||
      msg.includes("getaddrinfo")
    ) {
      return true;
    }
    if (isPgSslHandshakeProblem(err)) return true;
    return err.cause ? walk(err.cause) : false;
  };
  return walk(e);
}
