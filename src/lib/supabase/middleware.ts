import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfigOrNull } from "./env";

function isPublicAuthPath(pathname: string) {
  return (
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth/register-intent")
  );
}

export async function updateSession(request: NextRequest) {
  try {
    const config = getSupabaseConfigOrNull();

    if (!config) {
      if (isPublicAuthPath(request.nextUrl.pathname)) {
        return NextResponse.next();
      }
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "error",
        "missing_env"
      );
      return NextResponse.redirect(url);
    }

    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublicAuthPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    if (user && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (err) {
    console.error("[middleware] updateSession", err);
    if (isPublicAuthPath(request.nextUrl.pathname)) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}
