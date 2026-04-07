/**
 * Reduz CSRF entre sites em produção: mutações só com Origin/Referer alinhados ao host.
 * Pedidos same-origin do browser enviam Origin; ferramentas sem header falham em produção.
 */
export function assertMutationOrigin(request: Request): void {
  if (process.env.NODE_ENV !== "production") return;

  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase();
  if (!host) return;

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const u = new URL(origin);
      if (u.hostname.toLowerCase() === host) return;
    } catch {
      /* fall through */
    }
    throw new Error("origin_mismatch");
  }

  const ref = request.headers.get("referer");
  if (ref) {
    try {
      const u = new URL(ref);
      if (u.hostname.toLowerCase() === host) return;
    } catch {
      /* fall through */
    }
    throw new Error("origin_mismatch");
  }

  throw new Error("origin_mismatch");
}
