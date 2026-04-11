import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "@/lib/auth/jwt";
import { getClientIp } from "@/lib/client-ip";
import { nextResponseForDbError } from "@/lib/db-http";
import { rateLimitExceeded } from "@/lib/rate-limit-memory";
import { assertMutationOrigin } from "@/lib/request-origin";
import { loginLookup } from "@/server/salon-db";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

/** Hash fixo para comparação quando o utilizador não existe (mitiga timing/oracle). */
const BCRYPT_TIMING_DUMMY =
  "$2b$12$xA29zj9qDNI1EqycsvCZAe7wHjI/zUDPTmQ0IexkClFZbkKOT9lR6";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_PER_IP = 30;

function sessionCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

async function delayFailedAttempt() {
  await new Promise((r) =>
    setTimeout(r, 120 + Math.floor(Math.random() * 180))
  );
}

export async function POST(request: Request) {
  try {
    assertMutationOrigin(request);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      await delayFailedAttempt();
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const row = await loginLookup(email);
    const hashForCompare = row?.password_hash ?? BCRYPT_TIMING_DUMMY;
    const ok = await bcrypt.compare(password, hashForCompare);

    if (!row || !ok) {
      if (rateLimitExceeded(`login:${ip}`, LOGIN_MAX_PER_IP, LOGIN_WINDOW_MS)) {
        await delayFailedAttempt();
        return NextResponse.json({ error: "rate_limit" }, { status: 429 });
      }
      await delayFailedAttempt();
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const token = await signSession(row.id, email.trim().toLowerCase());
    const store = await cookies();
    store.set(COOKIE_NAME, token, sessionCookieOpts());

    return NextResponse.json({ ok: true });
  } catch (e) {
    const dbResp = nextResponseForDbError(e, "login", "rpc");
    if (dbResp) return dbResp;
    console.error("[login]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
