import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}

export function createMiddlewareSupabase(req: NextRequest, res: NextResponse) {
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll: () => {
        const cookieHeader = req.headers.get("cookie") ?? "";
        if (!cookieHeader) return [];

        return cookieHeader.split(";").map((part) => {
          const [rawName, ...rawValue] = part.split("=");
          return { name: rawName.trim(), value: decodeURIComponent(rawValue.join("=").trim()) };
        });
      },
      setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[], headers: Record<string, string>) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value ?? "", {
            path: options?.path as string | undefined,
            httpOnly: options?.httpOnly as boolean | undefined,
            secure: options?.secure as boolean | undefined,
            sameSite: options?.sameSite as "lax" | "strict" | "none" | undefined,
            maxAge: options?.maxAge as number | undefined,
            domain: options?.domain as string | undefined,
          });
        });

        Object.entries(headers).forEach(([key, value]) => res.headers.set(key, value));
      },
    },
  });
}
