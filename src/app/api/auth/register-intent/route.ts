import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { getSql } from "@/lib/db";
import { pgErrorCode } from "@/lib/db-connect-error";
import { nextResponseForDbError } from "@/lib/db-http";
import { isDisposableEmail, normalizeEmail } from "@/lib/email-policy";
import { assertMutationOrigin } from "@/lib/request-origin";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 12;

export async function POST(request: Request) {
  try {
    assertMutationOrigin(request);
  } catch {
    return NextResponse.json(
      { ok: false, code: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json().catch(() => null);
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

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { ok: false, code: "server_misconfigured" },
        { status: 503 }
      );
    }

    const sql = getSql();
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const ip = getClientIp(request);

    let emailCount = 0;
    let ipCount = 0;
    try {
      const [{ c: ec }] = await sql<{ c: string }[]>`
        SELECT count(*)::text AS c FROM signup_attempts
        WHERE email_norm = ${email} AND created_at >= ${since}::timestamptz
      `;
      emailCount = Number(ec);

      const [{ c: ic }] = await sql<{ c: string }[]>`
        SELECT count(*)::text AS c FROM signup_attempts
        WHERE ip = ${ip} AND created_at >= ${since}::timestamptz
      `;
      ipCount = Number(ic);
    } catch (e) {
      if (pgErrorCode(e) === "42P01") {
        return NextResponse.json({ ok: true });
      }
      const dbCount = nextResponseForDbError(
        e,
        "register-intent:count",
        "intent"
      );
      if (dbCount) return dbCount;
      throw e;
    }

    if (emailCount >= MAX_PER_EMAIL) {
      return NextResponse.json(
        { ok: false, code: "rate_limit_email" },
        { status: 429 }
      );
    }
    if (ipCount >= MAX_PER_IP) {
      return NextResponse.json(
        { ok: false, code: "rate_limit_ip" },
        { status: 429 }
      );
    }

    try {
      await sql`
        INSERT INTO signup_attempts (email_norm, ip)
        VALUES (${email}, ${ip})
      `;
    } catch (e) {
      if (pgErrorCode(e) === "42P01") {
        return NextResponse.json({ ok: true });
      }
      const dbIns = nextResponseForDbError(
        e,
        "register-intent:insert",
        "intent"
      );
      if (dbIns) return dbIns;
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const dbResp = nextResponseForDbError(e, "register-intent", "intent");
    if (dbResp) return dbResp;
    console.error("[register-intent]", e);
    return NextResponse.json(
      { ok: false, code: "internal" },
      { status: 500 }
    );
  }
}
