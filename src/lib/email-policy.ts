import disposableDomains from "disposable-email-domains";

const disposableSet = new Set(
  (disposableDomains as string[]).map((d) => d.toLowerCase())
);

/** Domínios extras comuns de e-mail temporário / descartável */
const EXTRA_BLOCKED = new Set(
  [
    "mailinator.com",
    "guerrillamail.com",
    "guerrillamail.org",
    "sharklasers.com",
    "yopmail.com",
    "tempmail.com",
    "temp-mail.org",
    "throwaway.email",
    "getnada.com",
    "maildrop.cc",
    "trashmail.com",
    "emailondeck.com",
    "fakeinbox.com",
    "mailnesia.com",
    "dispostable.com",
    "mailcatch.com",
    "mintemail.com",
    "mytrashmail.com",
    "spam4.me",
    "grr.la",
    "pokemail.net",
    "spamgourmet.com",
  ].map((d) => d.toLowerCase())
);

function domainSuffixes(hostname: string): string[] {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    out.push(parts.slice(i).join("."));
  }
  return out;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * E-mail de serviço descartável / temporário (lista pública + extras).
 */
export function isDisposableEmail(email: string): boolean {
  const norm = normalizeEmail(email);
  const at = norm.lastIndexOf("@");
  if (at < 1 || at === norm.length - 1) return false;
  const domain = norm.slice(at + 1);
  for (const suffix of domainSuffixes(domain)) {
    if (disposableSet.has(suffix) || EXTRA_BLOCKED.has(suffix)) return true;
  }
  return false;
}
