import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

const PROTECTED_PATHS = ["/dashboard", "/admin", "/profile"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareSupabase(req, res);

  // getSession refreshes tokens when needed and writes cookies with setAll.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Supabase middleware refresh error:", sessionError.message);
  }

  const pathname = req.nextUrl.pathname;

  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isClubAdminPath = /^\/clubs\/[^/]+\/admin(?:\/|$)/.test(pathname);

  // If route is protected and there is no session, redirect to /login
  if (isProtected || isClubAdminPath) {
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
