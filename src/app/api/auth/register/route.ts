import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "@/lib/auth/jwt";
import { getClientIp } from "@/lib/client-ip";
import {
  isDbConnectionRefused,
  isPgPasswordAuthFailed,
} from "@/lib/db-connect-error";
import {
  isPasswordStrongEnough,
  passwordPolicyMessage,
} from "@/lib/password-policy";
import { rateLimitExceeded } from "@/lib/rate-limit-memory";
import { assertMutationOrigin } from "@/lib/request-origin";
import { registerUserApp } from "@/server/salon-db";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 12;

const REGISTER_WINDOW_MS = 60 * 60 * 1000;
const REGISTER_MAX_PER_IP = 8;

function sessionCookieOpts() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE,
    path: "/",
  };
}

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
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (rateLimitExceeded(`register:${ip}`, REGISTER_MAX_PER_IP, REGISTER_WINDOW_MS)) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password =
      typeof body?.password === "string" ? body.password : "";
    const fullName =
      typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const salonName =
      typeof body?.salonName === "string" ? body.salonName.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "validation", message: "email required" },
        { status: 400 }
      );
    }
    if (!isPasswordStrongEnough(password)) {
      return NextResponse.json(
        {
          error: "validation",
          message: passwordPolicyMessage(),
        },
        { status: 400 }
      );
    }
    if (!fullName || !salonName) {
      return NextResponse.json(
        { error: "validation", message: "fullName and salonName required" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const { id } = await registerUserApp({
      email,
      passwordHash,
      fullName,
      salonName,
    });

    const token = await signSession(id, email.toLowerCase());
    const store = await cookies();
    store.set(COOKIE_NAME, token, sessionCookieOpts());

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (pgCode(e) === "23505") {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
    if (isPgPasswordAuthFailed(e)) {
      return NextResponse.json({ error: "db_auth_failed" }, { status: 503 });
    }
    if (isDbConnectionRefused(e)) {
      return NextResponse.json({ error: "db_unreachable" }, { status: 503 });
    }
    console.error("[register]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
