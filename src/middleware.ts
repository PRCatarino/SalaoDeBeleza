import { type NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, verifySessionEdge } from "@/lib/auth/jwt";

function isPublicAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/auth/register-intent")
  );
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/_next") ||
    path === "/favicon.ico" ||
    /\.(?:svg|png|jpg|jpeg|gif|webp)$/.test(path)
  ) {
    return NextResponse.next();
  }

  const secret = process.env.AUTH_SECRET?.trim() ?? "";
  const token = request.cookies.get(COOKIE_NAME)?.value ?? null;
  const session =
    secret.length >= 32 && token
      ? await verifySessionEdge(token, secret)
      : null;

  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isPublicAuthPath(path)) {
    return NextResponse.next();
  }

  if (secret.length < 32) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 }
      );
    }
    const u = request.nextUrl.clone();
    u.pathname = "/login";
    u.searchParams.set("error", "missing_auth_secret");
    return NextResponse.redirect(u);
  }

  if (!session) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
