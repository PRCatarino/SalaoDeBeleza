const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SAFE_FILE_RE = /^[a-f0-9]{48}\.(jpg|jpeg|png|gif|webp)$/i;

function normalizeAvatarPath(url: string): string {
  const u = url.trim();
  if (!u.startsWith("/")) return "";
  if (u.includes("..") || u.includes("\\")) return "";
  return u;
}

/**
 * Aceita apenas URLs servidas pela app ou legado local (mesmo utilizador).
 * Rejeita javascript:, data:, http externo, etc.
 */
export function sanitizeAvatarUrl(
  url: string | null | undefined,
  sub: string
): string | null {
  if (url == null || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  if (!UUID_RE.test(sub)) return null;

  const path = normalizeAvatarPath(trimmed);
  if (!path) return null;

  const apiPrefix = `/api/avatars/${sub}/`;
  if (path.startsWith(apiPrefix)) {
    const rest = path.slice(apiPrefix.length);
    if (SAFE_FILE_RE.test(rest)) return path;
    return null;
  }

  const legacy = `/uploads/avatars/${sub}/`;
  if (path.startsWith(legacy)) {
    const rest = path.slice(legacy.length);
    if (/^[a-zA-Z0-9._-]+$/.test(rest) && rest.length <= 200) return path;
    return null;
  }

  return null;
}
