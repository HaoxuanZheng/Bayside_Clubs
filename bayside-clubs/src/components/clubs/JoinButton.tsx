"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type JoinButtonProps = {
  clubId: string;
};

export default function JoinButton({ clubId }: JoinButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  const [isMember, setIsMember] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const checkMembership = async () => {
      if (isLoading) {
        return;
      }

      if (!user) {
        if (isMounted) {
          setIsMember(false);
          setIsChecking(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", user.id)
        .eq("club_id", clubId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      setIsMember(Boolean(data) && !error);
      setIsChecking(false);
    };

    void checkMembership();

    return () => {
      isMounted = false;
    };
  }, [clubId, isLoading, user]);

  const buttonText = useMemo(() => {
    if (isChecking || isSubmitting) {
      return "Loading...";
    }

    return isMember ? "Leave Club" : "Join Club";
  }, [isChecking, isMember, isSubmitting]);

  const handleToggleMembership = async () => {
    if (isSubmitting || isChecking) {
      return;
    }

    if (!user) {
      const from = encodeURIComponent(pathname || `/clubs/${clubId}`);
      router.push(`/login?from=${from}`);
      return;
    }

    setIsSubmitting(true);

    const previousState = isMember;
    const nextState = !previousState;
    setIsMember(nextState);

    try {
      if (previousState) {
        const { error } = await supabase
          .from("memberships")
          .delete()
          .eq("user_id", user.id)
          .eq("club_id", clubId);

        if (error) {
          throw error;
        }
      } else {
        const { error } = await supabase.from("memberships").insert({
          user_id: user.id,
          club_id: clubId,
          role: "member",
        });

        if (error) {
          throw error;
        }
      }

      router.refresh();
    } catch {
      setIsMember(previousState);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggleMembership}
      disabled={isChecking || isSubmitting}
      className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {buttonText}
    </button>
  );
}
