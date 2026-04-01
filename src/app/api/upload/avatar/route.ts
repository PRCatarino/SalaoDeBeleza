import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/jwt";

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp"]);

export async function POST(request: Request) {
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }

  const name = file.name || "upload";
  const extFromName = (name.split(".").pop() || "").toLowerCase();
  let ext = extFromName;
  if (!ALLOWED_EXT.has(ext)) {
    const t = file.type.toLowerCase();
    if (t.includes("jpeg")) ext = "jpg";
    else if (t.includes("png")) ext = "png";
    else if (t.includes("gif")) ext = "gif";
    else if (t.includes("webp")) ext = "webp";
  }
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  const ts = Date.now();
  const filename = `${ts}.${ext}`;
  const dir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "avatars",
    sub
  );
  const rel = `/uploads/avatars/${sub}/${filename}`;
  const full = path.join(dir, filename);

  await mkdir(dir, { recursive: true });
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(full, buf);

  return NextResponse.json({ url: rel });
}
