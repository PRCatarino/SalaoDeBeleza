import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth/jwt";
import {
  MAX_AVATAR_BYTES,
  randomAvatarFilename,
  sniffAvatarImage,
} from "@/lib/image-sniff";
import { assertMutationOrigin } from "@/lib/request-origin";

export async function POST(request: Request) {
  try {
    assertMutationOrigin(request);
  } catch {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
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

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json({ error: "file_too_large" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffAvatarImage(buf);
  if (!sniffed) {
    return NextResponse.json({ error: "invalid_image" }, { status: 400 });
  }

  const filename = randomAvatarFilename(sniffed.ext);
  const userRoot = path.resolve(process.cwd(), "data", "private-avatars", sub);
  const fullPath = path.resolve(userRoot, filename);
  const rel = path.relative(userRoot, fullPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  await mkdir(userRoot, { recursive: true });
  await writeFile(fullPath, buf);

  const url = `/api/avatars/${sub}/${filename}`;
  return NextResponse.json({ url });
}
