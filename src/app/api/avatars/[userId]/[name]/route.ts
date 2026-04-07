import { readFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/jwt";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FILE_RE = /^[a-f0-9]{48}\.(jpg|jpeg|png|gif|webp)$/i;

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string; name: string }> }
) {
  const { userId, name } = await context.params;

  if (!UUID_RE.test(userId) || !FILE_RE.test(name)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let sub: string;
  try {
    const s = await verifySession(raw);
    sub = s.sub;
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (sub !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const mime = MIME[ext];
  if (!mime) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const safeName = path.basename(name);
  const userRoot = path.resolve(
    process.cwd(),
    "data",
    "private-avatars",
    userId
  );
  const filePath = path.resolve(userRoot, safeName);
  const rel = path.relative(userRoot, filePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  try {
    const buf = await readFile(filePath);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
