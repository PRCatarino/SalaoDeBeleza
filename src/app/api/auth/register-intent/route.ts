import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { PostgrestError } from "@supabase/supabase-js";
import { isDisposableEmail, normalizeEmail } from "@/lib/email-policy";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 12;

/** Tabela ainda não criada no projeto → não bloquear cadastro (limite só após rodar o SQL). */
function isMissingSignupAttemptsTable(err: PostgrestError): boolean {
  const m = (err.message || "").toLowerCase();
  const c = err.code || "";
  return (
    c === "PGRST205" ||
    c === "42P01" ||
    (m.includes("signup_attempts") &&
      (m.includes("schema cache") ||
        m.includes("does not exist") ||
        m.includes("not found")))
  );
}

function isInvalidServiceKeyError(err: PostgrestError): boolean {
  const m = (err.message || "").toLowerCase();
  return (
    m.includes("invalid api key") ||
    m.includes("jwt") ||
    m.includes("invalid authentication")
  );
}

function getClientIp(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const emailRaw = body?.email;
    if (typeof emailRaw !== "string" || !emailRaw.includes("@")) {
      return NextResponse.json(
        { ok: false, code: "invalid_email" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(emailRaw);
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { ok: false, code: "disposable_email" },
        { status: 403 }
      );
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceKey?.trim() || !url?.trim()) {
      return NextResponse.json(
        { ok: false, code: "server_misconfigured" },
        { status: 503 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const ip = getClientIp(request);

    const { count: emailCount, error: e1 } = await supabase
      .from("signup_attempts")
      .select("*", { count: "exact", head: true })
      .eq("email_norm", email)
      .gte("created_at", since);

    if (e1) {
      console.error("[register-intent] email count", e1);
      if (isMissingSignupAttemptsTable(e1)) {
        console.warn(
          "[register-intent] Tabela signup_attempts inexistente — rode supabase/migration_signup_attempts.sql no SQL Editor"
        );
        return NextResponse.json({ ok: true });
      }
      if (isInvalidServiceKeyError(e1)) {
        return NextResponse.json(
          { ok: false, code: "supabase_key_invalid" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ok: false, code: "internal" },
        { status: 500 }
      );
    }

    if ((emailCount ?? 0) >= MAX_PER_EMAIL) {
      return NextResponse.json(
        { ok: false, code: "rate_limit_email" },
        { status: 429 }
      );
    }

    const { count: ipCount, error: e2 } = await supabase
      .from("signup_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("created_at", since);

    if (e2) {
      console.error("[register-intent] ip count", e2);
      if (isMissingSignupAttemptsTable(e2)) {
        return NextResponse.json({ ok: true });
      }
      if (isInvalidServiceKeyError(e2)) {
        return NextResponse.json(
          { ok: false, code: "supabase_key_invalid" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ok: false, code: "internal" },
        { status: 500 }
      );
    }

    if ((ipCount ?? 0) >= MAX_PER_IP) {
      return NextResponse.json(
        { ok: false, code: "rate_limit_ip" },
        { status: 429 }
      );
    }

    const { error: insErr } = await supabase.from("signup_attempts").insert({
      email_norm: email,
      ip,
    });

    if (insErr) {
      console.error("[register-intent] insert", insErr);
      if (isMissingSignupAttemptsTable(insErr)) {
        console.warn(
          "[register-intent] insert falhou (tabela?) — cadastro permitido; execute migration_signup_attempts.sql"
        );
        return NextResponse.json({ ok: true });
      }
      if (isInvalidServiceKeyError(insErr)) {
        return NextResponse.json(
          { ok: false, code: "supabase_key_invalid" },
          { status: 503 }
        );
      }
      return NextResponse.json(
        { ok: false, code: "internal" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[register-intent]", e);
    return NextResponse.json(
      { ok: false, code: "internal" },
      { status: 500 }
    );
  }
}
