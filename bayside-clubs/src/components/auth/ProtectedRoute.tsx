"use client";

import type { ReactNode } from "react";
import { useRequireAdmin, useRequireClubAdmin } from "@/hooks/useRouteGuards";

type BaseProtectedRouteProps = {
  children: ReactNode;
  fallback?: ReactNode;
  loginRedirectTo?: string;
  unauthorizedRedirectTo?: string;
};

type AdminRouteProps = BaseProtectedRouteProps;

type ClubAdminRouteProps = BaseProtectedRouteProps & {
  clubId: string;
};

const DEFAULT_FALLBACK = (
  <div className="mx-auto w-full max-w-4xl px-4 py-6 text-sm text-zinc-600">Loading...</div>
);

export function AdminRoute({
  children,
  fallback,
  loginRedirectTo,
  unauthorizedRedirectTo,
}: AdminRouteProps) {
  const { isChecking, isAuthorized } = useRequireAdmin({
    loginRedirectTo,
    unauthorizedRedirectTo,
  });

  if (isChecking) {
    return <>{fallback ?? DEFAULT_FALLBACK}</>;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export function ClubAdminRoute({
  clubId,
  children,
  fallback,
  loginRedirectTo,
  unauthorizedRedirectTo,
}: ClubAdminRouteProps) {
  const { isChecking, isAuthorized } = useRequireClubAdmin(clubId, {
    loginRedirectTo,
    unauthorizedRedirectTo,
  });

  if (isChecking) {
    return <>{fallback ?? DEFAULT_FALLBACK}</>;
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
