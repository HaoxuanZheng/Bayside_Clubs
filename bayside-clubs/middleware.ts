import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/", "/clubs", "/events", "/login", "/register"];
const PROTECTED_PATHS = ["/dashboard", "/admin", "/profile"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabase(req, res);

  // Refresh the session token on every request.
  try {
    // getSession triggers token refresh when needed and writes cookies via setAll
    await supabase.auth.getSession();
  } catch (err) {
    // don't block requests on refresh errors
    // eslint-disable-next-line no-console
    console.error("Supabase middleware refresh error:", err);
  }

  const pathname = req.nextUrl.pathname;

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // If route is protected and there is no session, redirect to /login
  if (isProtected) {
    const { data } = await supabase.auth.getSession();
    const session = data?.session ?? null;

    if (!session) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Allow public routes and everything else to proceed.
  return res;
}

export const config = {
  // run middleware on all pages (but ignore static/_next assets)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
