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
    return err.cause ? walk(err.cause) : false;
  };
  return walk(e);
}
