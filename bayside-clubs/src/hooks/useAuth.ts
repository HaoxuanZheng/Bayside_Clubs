"use client";

import { useCallback, useMemo } from "react";
import { useAuth as useAuthContext } from "@/components/providers/AuthProvider";
import { supabase } from "@/lib/supabase/client";

type UseAuthResult = {
  user: ReturnType<typeof useAuthContext>["user"];
  profile: ReturnType<typeof useAuthContext>["profile"];
  isLoading: boolean;
  isAdmin: boolean;
  isClubAdmin: (clubId: string) => Promise<boolean>;
};

export function useAuth(): UseAuthResult {
  const { user, profile, isLoading } = useAuthContext();

  const isAdmin = profile?.role === "admin";

  const isClubAdmin = useCallback(
    async (clubId: string): Promise<boolean> => {
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("role")
        .eq("user_id", user.id)
        .eq("club_id", clubId)
        .maybeSingle();

      if (error || !data) {
        return false;
      }

      return data.role === "admin";
    },
    [user],
  );

  return useMemo(
    () => ({
      user,
      profile,
      isLoading,
      isAdmin,
      isClubAdmin,
    }),
    [user, profile, isLoading, isAdmin, isClubAdmin],
  );
}

export default useAuth;
