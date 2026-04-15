"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClubAdminRoute } from "@/components/auth/ProtectedRoute";
import { supabase } from "@/lib/supabase/client";

export default function ClubAdminPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();

  const slug = useMemo(() => params?.slug || "", [params]);
  const [clubId, setClubId] = useState<string>("");
  const [isResolving, setIsResolving] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const resolveClubId = async () => {
      if (!slug) {
        if (isMounted) {
          setIsResolving(false);
          router.replace("/clubs");
        }
        return;
      }

      const { data, error } = await supabase
        .from("clubs")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !data?.id) {
        setIsResolving(false);
        router.replace("/clubs");
        return;
      }

      setClubId(data.id);
      setIsResolving(false);
    };

    void resolveClubId();

    return () => {
      isMounted = false;
    };
  }, [router, slug]);

  if (isResolving) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-8 text-zinc-600">Loading...</main>
    );
  }

  return (
    <ClubAdminRoute clubId={clubId} unauthorizedRedirectTo="/clubs">
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-zinc-900">Club Admin</h1>
        <p className="mt-2 text-zinc-600">Manage settings for club slug: {slug}</p>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-zinc-900">Protected Area</h2>
          <p className="mt-2 text-sm text-zinc-700">
            Only platform admins or membership admins for this club can access this page.
          </p>
        </section>
      </main>
    </ClubAdminRoute>
  );
}
