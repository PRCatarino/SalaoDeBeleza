import { NextResponse } from "next/server";
import { getClientIp } from "@/lib/client-ip";
import { getSql } from "@/lib/db";
import {
  isDbConnectionRefused,
  isPgPasswordAuthFailed,
} from "@/lib/db-connect-error";
import { isDisposableEmail, normalizeEmail } from "@/lib/email-policy";
import { assertMutationOrigin } from "@/lib/request-origin";

const WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_PER_EMAIL = 3;
const MAX_PER_IP = 12;

function pgCode(e: unknown): string | undefined {
  if (e && typeof e === "object" && "code" in e) {
    return String((e as { code: unknown }).code);
  }
  return undefined;
}

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
      if (pgCode(e) === "42P01") {
        return NextResponse.json({ ok: true });
      }
      if (isPgPasswordAuthFailed(e)) {
        return NextResponse.json(
          { ok: false, code: "db_auth_failed" },
          { status: 503 }
        );
      }
      if (isDbConnectionRefused(e)) {
        return NextResponse.json(
          { ok: false, code: "db_unreachable" },
          { status: 503 }
        );
      }
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
      if (pgCode(e) === "42P01") {
        return NextResponse.json({ ok: true });
      }
      if (isPgPasswordAuthFailed(e)) {
        return NextResponse.json(
          { ok: false, code: "db_auth_failed" },
          { status: 503 }
        );
      }
      if (isDbConnectionRefused(e)) {
        return NextResponse.json(
          { ok: false, code: "db_unreachable" },
          { status: 503 }
        );
      }
      throw e;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isPgPasswordAuthFailed(e)) {
      return NextResponse.json(
        { ok: false, code: "db_auth_failed" },
        { status: 503 }
      );
    }
    if (isDbConnectionRefused(e)) {
      return NextResponse.json(
        { ok: false, code: "db_unreachable" },
        { status: 503 }
      );
    }
    console.error("[register-intent]", e);
    return NextResponse.json(
      { ok: false, code: "internal" },
      { status: 500 }
    );
  }
}
