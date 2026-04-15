"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
      router.push("/login");
    }
  };

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold text-zinc-900">
          BaysideClubs
        </Link>

        <div className="flex items-center gap-3">
          {!isLoading && !user && (
            <>
              <Link
                href="/login"
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
              >
                Register
              </Link>
            </>
          )}

          {!isLoading && user && (
            <>
              <span className="text-sm font-medium text-zinc-700">
                {profile?.display_name || user.email || "User"}
              </span>

              {profile?.role === "admin" && (
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Admin
                </span>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Logout"}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
