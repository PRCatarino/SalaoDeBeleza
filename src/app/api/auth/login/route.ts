import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "@/lib/auth/jwt";
import {
  isDbConnectionRefused,
  isPgPasswordAuthFailed,
} from "@/lib/db-connect-error";
import { loginLookup } from "@/server/salon-db";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sessionCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const row = await loginLookup(email);
    if (!row) {
      return NextResponse.json(
        { error: "invalid_credentials" },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) {
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
    if (isPgPasswordAuthFailed(e)) {
      return NextResponse.json({ error: "db_auth_failed" }, { status: 503 });
    }
    if (isDbConnectionRefused(e)) {
      return NextResponse.json({ error: "db_unreachable" }, { status: 503 });
    }
    throw e;
  }
}
