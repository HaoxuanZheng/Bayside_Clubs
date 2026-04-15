"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

type GuardOptions = {
  loginRedirectTo?: string;
  unauthorizedRedirectTo?: string;
};

type GuardResult = {
  isChecking: boolean;
  isAuthorized: boolean;
};

export function useRequireAdmin(options?: GuardOptions): GuardResult {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin } = useAuth();

  const loginRedirectTo = options?.loginRedirectTo ?? "/login";
  const unauthorizedRedirectTo = options?.unauthorizedRedirectTo ?? "/dashboard";

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      const from = encodeURIComponent(pathname || "/");
      router.replace(`${loginRedirectTo}?from=${from}`);
      return;
    }

    if (!isAdmin) {
      router.replace(unauthorizedRedirectTo);
    }
  }, [isLoading, user, isAdmin, pathname, router, loginRedirectTo, unauthorizedRedirectTo]);

  return useMemo(
    () => ({
      isChecking: isLoading,
      isAuthorized: Boolean(user && isAdmin),
    }),
    [isLoading, user, isAdmin],
  );
}

export function useRequireClubAdmin(clubId: string, options?: GuardOptions): GuardResult {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAdmin, isClubAdmin } = useAuth();

  const [membershipLoading, setMembershipLoading] = useState<boolean>(true);
  const [hasClubAccess, setHasClubAccess] = useState<boolean>(false);

  const loginRedirectTo = options?.loginRedirectTo ?? "/login";
  const unauthorizedRedirectTo = options?.unauthorizedRedirectTo ?? "/dashboard";

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (isLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setMembershipLoading(false);
        }
        const from = encodeURIComponent(pathname || "/");
        router.replace(`${loginRedirectTo}?from=${from}`);
        return;
      }

      if (isAdmin) {
        if (isMounted) {
          setHasClubAccess(true);
          setMembershipLoading(false);
        }
        return;
      }

      if (!clubId) {
        if (isMounted) {
          setHasClubAccess(false);
          setMembershipLoading(false);
        }
        router.replace(unauthorizedRedirectTo);
        return;
      }

      if (isMounted) {
        setMembershipLoading(true);
      }
      const allowed = await isClubAdmin(clubId);
      if (isMounted) {
        setHasClubAccess(allowed);
        setMembershipLoading(false);
      }

      if (!allowed) {
        router.replace(unauthorizedRedirectTo);
      }
    };

    void run();

    return () => {
      isMounted = false;
    };
  }, [
    isLoading,
    user,
    isAdmin,
    clubId,
    isClubAdmin,
    pathname,
    router,
    loginRedirectTo,
    unauthorizedRedirectTo,
  ]);

  return useMemo(
    () => ({
      isChecking: isLoading || membershipLoading,
      isAuthorized: Boolean(user) && (isAdmin || hasClubAccess),
    }),
    [isLoading, membershipLoading, user, isAdmin, hasClubAccess],
  );
}
