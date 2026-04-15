import ClubGrid from "@/components/clubs/ClubGrid";
import type { ClubListItem } from "@/components/clubs/ClubCard";
import type { ClubCategory } from "@/lib/types";
import { createServerSupabase } from "@/lib/supabase/server";

type ClubWithMembershipCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ClubCategory | null;
  memberships: { count: number }[] | null;
};

export default async function ClubsPage() {
  const supabase = await createServerSupabase();

  let clubs: ClubListItem[] = [];

  try {
    const { data, error } = await supabase
      .from("clubs")
      .select("id, name, slug, description, category")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const clubRows = (data ?? []) as ClubWithMembershipCount[];
    const clubIds = clubRows.map((club) => club.id);

    const { data: membershipCounts, error: countError } = clubIds.length
      ? await supabase
          .from("memberships")
          .select("club_id")
          .in("club_id", clubIds)
      : { data: [], error: null };

    if (countError) {
      throw countError;
    }

    const memberCountByClubId = (membershipCounts ?? []).reduce<Record<string, number>>(
      (counts, membership) => {
        counts[membership.club_id] = (counts[membership.club_id] ?? 0) + 1;
        return counts;
      },
    );

    clubs = clubRows.map((club) => ({
      id: club.id,
      name: club.name,
      slug: club.slug,
      description: club.description,
      category: club.category,
      memberCount: memberCountByClubId[club.id] ?? 0,
    }));
  } catch (error) {
    console.error("Failed to load clubs page:", error);
  }

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Explore Clubs</h1>
        <p className="mt-2 text-zinc-600">Find a club, explore details, and join your community.</p>
      </div>

      {clubs.length > 0 ? (
        <ClubGrid clubs={clubs} />
      ) : (
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
            Clubs are temporarily unavailable.
          </div>
        </section>
      )}
    </main>
  );
}
