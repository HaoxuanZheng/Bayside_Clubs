import { redirect } from "next/navigation";
import ClubAdminDashboard from "@/components/dashboard/ClubAdminDashboard";
import ClubSelector from "@/components/dashboard/ClubSelector";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ClubCategory } from "@/lib/types";

type ClubOption = {
  id: string;
  name: string;
  slug: string;
};

type ClubDetails = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meeting_info: string | null;
  contact_email: string | null;
  category: ClubCategory | null;
};

type MemberRow = {
  membershipId: string;
  userId: string;
  role: "member" | "officer" | "admin";
  joinedAt: string;
  displayName: string;
  grade: number | null;
};

type RecentRegistration = {
  id: string;
  eventTitle: string;
  registeredAt: string;
};

function startOfWeek(value: Date): Date {
  const start = new Date(value);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default async function DashboardPage({ searchParams }: { searchParams?: { club?: string } }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminMemberships, error: membershipError } = await supabase
    .from("memberships")
    .select("club_id")
    .eq("user_id", user.id)
    .eq("role", "admin");

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  const adminClubIds = (adminMemberships ?? []).map((membership) => membership.club_id);

  if (adminClubIds.length === 0) {
    redirect("/clubs");
  }

  const { data: clubRows, error: clubsError } = await supabase
    .from("clubs")
    .select("id, name, slug, description, meeting_info, contact_email, category")
    .in("id", adminClubIds)
    .order("name", { ascending: true });

  if (clubsError) {
    throw new Error(clubsError.message);
  }

  const clubs = (clubRows ?? []) as ClubOption[];
  const selectedClubId = adminClubIds.includes(searchParams?.club ?? "") ? searchParams?.club ?? adminClubIds[0] : adminClubIds[0];
  const selectedClub = clubs.find((club) => club.id === selectedClubId) ?? clubs[0];

  if (!selectedClub) {
    redirect("/clubs");
  }

  const [{ data: memberRows, error: membersError }, { data: eventRows, error: eventsError }] = await Promise.all([
    supabase
      .from("memberships")
      .select("id, user_id, role, joined_at")
      .eq("club_id", selectedClub.id)
      .order("joined_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, starts_at, capacity, is_published")
      .eq("club_id", selectedClub.id)
      .order("starts_at", { ascending: false }),
  ]);

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const memberRowsTyped = (memberRows ?? []) as {
    id: string;
    user_id: string;
    role: "member" | "officer" | "admin";
    joined_at: string;
  }[];

  const memberUserIds = memberRowsTyped.map((member) => member.user_id);
  const memberProfiles = memberUserIds.length
    ? await supabase.from("profiles").select("id, display_name, grade").in("id", memberUserIds)
    : { data: [], error: null };

  if (memberProfiles.error) {
    throw new Error(memberProfiles.error.message);
  }

  const profileById = new Map(
    (memberProfiles.data ?? []).map((profile) => [profile.id, profile]),
  );

  const members: MemberRow[] = memberRowsTyped.map((member) => ({
    membershipId: member.id,
    userId: member.user_id,
    role: member.role,
    joinedAt: member.joined_at,
    displayName: profileById.get(member.user_id)?.display_name ?? "Unknown Member",
    grade: profileById.get(member.user_id)?.grade ?? null,
  }));

  const eventRowsTyped = (eventRows ?? []) as {
    id: string;
    title: string;
    starts_at: string;
    capacity: number | null;
    is_published: boolean;
  }[];

  const eventIds = eventRowsTyped.map((event) => event.id);
  const confirmedRegistrations = eventIds.length
    ? await supabase
        .from("registrations")
        .select("id, event_id, registered_at, status")
        .in("event_id", eventIds)
        .eq("status", "confirmed")
    : { data: [], error: null };

  if (confirmedRegistrations.error) {
    throw new Error(confirmedRegistrations.error.message);
  }

  const registrations = confirmedRegistrations.data ?? [];
  const registrationCountByEventId = registrations.reduce<Record<string, number>>((counts, registration) => {
    counts[registration.event_id] = (counts[registration.event_id] ?? 0) + 1;
    return counts;
  }, {});

  const startOfCurrentWeek = startOfWeek(new Date());
  const nextWeekStart = new Date(startOfCurrentWeek);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const thisWeeksRegistrations = registrations.filter((registration) => {
    const registeredAt = new Date(registration.registered_at);
    return registeredAt >= startOfCurrentWeek && registeredAt < nextWeekStart;
  }).length;

  const upcomingEvents = eventRowsTyped.filter((event) => event.is_published && new Date(event.starts_at) > new Date()).length;

  const recentRegistrations: RecentRegistration[] = registrations
    .slice()
    .sort((left, right) => new Date(right.registered_at).getTime() - new Date(left.registered_at).getTime())
    .slice(0, 5)
    .map((registration) => ({
      id: registration.id,
      eventTitle: eventRowsTyped.find((event) => event.id === registration.event_id)?.title ?? "Event",
      registeredAt: registration.registered_at,
    }));

  const clubDetails = selectedClub as ClubDetails;

  return (
    <main className="min-h-screen bg-zinc-50 pb-10">
      <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Club Admin Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900">Manage your clubs</h1>
            <p className="mt-2 text-zinc-600">Switch clubs, review members, manage events, and update settings.</p>
          </div>

          <ClubSelector clubs={clubs} selectedClubId={selectedClub.id} />
        </div>
      </section>

      <ClubAdminDashboard
        selectedClub={{ id: clubDetails.id, name: clubDetails.name, slug: clubDetails.slug }}
        stats={{
          totalMembers: members.length,
          upcomingEvents,
          thisWeeksRegistrations,
        }}
        members={members}
        events={eventRowsTyped.map((event) => ({
          id: event.id,
          title: event.title,
          startsAt: event.starts_at,
          capacity: event.capacity,
          isPublished: event.is_published,
          registrationCount: registrationCountByEventId[event.id] ?? 0,
        }))}
        recentRegistrations={recentRegistrations}
        settings={{
          description: clubDetails.description,
          meeting_info: clubDetails.meeting_info,
          contact_email: clubDetails.contact_email,
          category: clubDetails.category,
        }}
      />
    </main>
  );
}
