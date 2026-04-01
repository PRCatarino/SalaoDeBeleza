import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, signSession } from "@/lib/auth/jwt";
import {
  isDbConnectionRefused,
  isPgPasswordAuthFailed,
} from "@/lib/db-connect-error";
import { registerUserApp } from "@/server/salon-db";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const BCRYPT_ROUNDS = 12;

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
    if (password.length < 6) {
      return NextResponse.json(
        { error: "validation", message: "password min 6 characters" },
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
    throw e;
  }
}
