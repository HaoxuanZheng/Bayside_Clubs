"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui";

type NavLink = {
  href: string;
  label: string;
};

const primaryLinks: NavLink[] = [
  { href: "/clubs", label: "Clubs" },
  { href: "/events", label: "Events" },
];

function cx(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export default function Navbar() {
  const router = useRouter();
  const { user, profile, isLoading, isAdmin } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hasClubAdminRole, setHasClubAdminRole] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await supabase.auth.signOut();
    } finally {
      setIsSigningOut(false);
      router.push("/login");
    }
  };

  useEffect(() => {
    let isMounted = true;

    const resolveDashboardAccess = async () => {
      if (!user) {
        if (isMounted) {
          setHasClubAdminRole(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .limit(1);

      if (!isMounted) {
        return;
      }

      setHasClubAdminRole(!error && (data?.length ?? 0) > 0);
    };

    void resolveDashboardAccess();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        event.target instanceof Node &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const dropdownItems = useMemo(
    () =>
      [
        { href: "/profile", label: "My Profile", visible: true },
        { href: "/clubs", label: "My Clubs", visible: true },
        { href: "/dashboard", label: "Dashboard", visible: hasClubAdminRole },
        { href: "/admin", label: "Admin Panel", visible: isAdmin },
      ].filter((item) => item.visible),
    [hasClubAdminRole, isAdmin],
  );

  const mobileLinks = useMemo(
    () => [
      ...primaryLinks,
      ...(user
        ? dropdownItems.map((item) => ({ href: item.href, label: item.label }))
        : [
            { href: "/login", label: "Login" },
            { href: "/register", label: "Register" },
          ]),
    ],
    [dropdownItems, user],
  );

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-lg font-bold text-[#1E3A5F]">
            Bayside Hub
          </Link>
          <div className="hidden items-center gap-5 md:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 transition hover:text-[#1E3A5F]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="rounded-md p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="hidden items-center gap-3 md:flex">
          {!isLoading && !user && (
            <>
              <Button variant="ghost" size="sm" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button size="sm" onClick={() => router.push("/register")}>
                Register
              </Button>
            </>
          )}

          {!isLoading && user && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((open) => !open)}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <span>{profile?.display_name || user.email || "User"}</span>
                {isAdmin && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold uppercase text-emerald-700">
                    Admin
                  </span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cx(
                  "absolute right-0 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg transition",
                  isDropdownOpen
                    ? "pointer-events-auto translate-y-0 opacity-100"
                    : "pointer-events-none -translate-y-1 opacity-0",
                )}
              >
                <div className="space-y-1">
                  {dropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block rounded-md px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="my-2 border-t border-slate-200" />

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSigningOut ? "Signing out..." : "Sign Out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cx(
          "fixed inset-0 z-40 bg-black/30 transition-opacity md:hidden",
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMenuOpen(false)}
        aria-hidden={!isMenuOpen}
      />
      <aside
        className={cx(
          "fixed right-0 top-0 z-50 h-full w-72 border-l border-slate-200 bg-white p-5 shadow-xl transition-transform md:hidden",
          isMenuOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <p className="text-lg font-bold text-[#1E3A5F]">Bayside Hub</p>
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="rounded-md p-2 text-slate-700 transition hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          {mobileLinks.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <button
              type="button"
              onClick={async () => {
                setIsMenuOpen(false);
                await handleSignOut();
              }}
              disabled={isSigningOut}
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          )}
        </div>
      </aside>
    </nav>
  );
}
