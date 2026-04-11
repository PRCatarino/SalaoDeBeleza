import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/jwt";
import { nextResponseForDbError } from "@/lib/db-http";
import { profileEnsure } from "@/server/salon-db";

export async function GET() {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let sub: string;
  let email: string;
  try {
    const s = await verifySession(raw);
    sub = s.sub;
    email = s.email;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const profile = await profileEnsure(sub, email);
    if (!profile) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json(profile);
  } catch (e) {
    const dbResp = nextResponseForDbError(e, "me", "rpc");
    if (dbResp) return dbResp;
    console.error("[me]", e);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
