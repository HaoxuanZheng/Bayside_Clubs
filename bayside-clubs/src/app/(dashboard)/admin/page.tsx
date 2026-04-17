import { redirect } from "next/navigation";
import SystemAdminPanel from "@/components/dashboard/SystemAdminPanel";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ClubCategory, ProfileRole } from "@/lib/types";

type UserRow = {
  id: string;
  email: string;
  display_name: string | null;
  grade: number | null;
  role: ProfileRole;
  is_active: boolean;
  created_at: string;
};

type ClubRow = {
  id: string;
  name: string;
  category: ClubCategory | null;
  is_active: boolean;
};

type MembershipRow = {
  id: string;
  user_id: string;
  club_id: string;
  role: "member" | "officer" | "admin";
};

type EventRow = {
  id: string;
  club_id: string;
};

export default async function AdminPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (currentProfile?.role !== "admin") {
    redirect("/clubs");
  }

  const nowIso = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const [
    usersResult,
    clubsResult,
    membershipsResult,
    eventsResult,
    totalUsersResult,
    totalClubsResult,
    upcomingEventsResult,
    monthlyRegistrationsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, display_name, grade, role, is_active, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("clubs")
      .select("id, name, category, is_active")
      .order("name", { ascending: true }),
    supabase.from("memberships").select("id, user_id, club_id, role"),
    supabase.from("events").select("id, club_id"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gt("starts_at", nowIso),
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .gte("registered_at", monthStart.toISOString())
      .lt("registered_at", nextMonthStart.toISOString()),
  ]);

  const queryError =
    usersResult.error ||
    clubsResult.error ||
    membershipsResult.error ||
    eventsResult.error ||
    totalUsersResult.error ||
    totalClubsResult.error ||
    upcomingEventsResult.error ||
    monthlyRegistrationsResult.error;

  if (queryError) {
    throw new Error(queryError.message);
  }

  const users = (usersResult.data ?? []) as UserRow[];
  const clubs = (clubsResult.data ?? []) as ClubRow[];
  const memberships = (membershipsResult.data ?? []) as MembershipRow[];
  const events = (eventsResult.data ?? []) as EventRow[];

  const memberCountByClubId = memberships.reduce<Record<string, number>>((counts, item) => {
    counts[item.club_id] = (counts[item.club_id] ?? 0) + 1;
    return counts;
  }, {});

  const eventCountByClubId = events.reduce<Record<string, number>>((counts, item) => {
    counts[item.club_id] = (counts[item.club_id] ?? 0) + 1;
    return counts;
  }, {});

  const userById = new Map(users.map((item) => [item.id, item]));
  const clubById = new Map(clubs.map((item) => [item.id, item]));

  const clubAdmins = memberships
    .filter((membership) => membership.role === "admin")
    .map((membership) => {
      const club = clubById.get(membership.club_id);
      const profile = userById.get(membership.user_id);
      if (!club || !profile) {
        return null;
      }
      return {
        membershipId: membership.id,
        userId: profile.id,
        displayName: profile.display_name || profile.email,
        email: profile.email,
        clubId: club.id,
        clubName: club.name,
      };
    })
    .filter(
      (
        item,
      ): item is {
        membershipId: string;
        userId: string;
        displayName: string;
        email: string;
        clubId: string;
        clubName: string;
      } => item !== null,
    )
    .sort((left, right) => left.clubName.localeCompare(right.clubName));

  const clubsWithCounts = clubs.map((club) => ({
    ...club,
    memberCount: memberCountByClubId[club.id] ?? 0,
    eventCount: eventCountByClubId[club.id] ?? 0,
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          System Admin
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">BaysideClubs Admin Panel</h1>
        <p className="mt-2 text-slate-600">
          Manage clubs, users, and platform-level permissions.
        </p>
      </header>

      <SystemAdminPanel
        stats={{
          totalUsers: totalUsersResult.count ?? 0,
          totalClubs: totalClubsResult.count ?? 0,
          totalUpcomingEvents: upcomingEventsResult.count ?? 0,
          totalRegistrationsThisMonth: monthlyRegistrationsResult.count ?? 0,
        }}
        users={users}
        clubs={clubsWithCounts}
        clubAdmins={clubAdmins}
      />
    </main>
  );
}

