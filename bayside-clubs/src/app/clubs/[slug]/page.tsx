import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import JoinButton from "@/components/clubs/JoinButton";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Club, MembershipRole } from "@/lib/types";

type ClubPageProps = {
  params: Promise<{ slug: string }>;
};

type EventPreview = {
  id: string;
  title: string;
  starts_at: string;
  location: string | null;
};

type AnnouncementPreview = {
  id: string;
  title: string;
  body: string | null;
  created_at: string;
};

type OfficerMembership = {
  user_id: string;
  role: MembershipRole;
};

type OfficerProfile = {
  id: string;
  display_name: string | null;
  email: string;
};

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return [];
  }

  const staticSupabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await staticSupabase
    .from("clubs")
    .select("slug")
    .eq("is_active", true);

  if (error) {
    return [];
  }

  return (data ?? []).map((club) => ({ slug: club.slug }));
}

export default async function ClubDetailPage({ params }: ClubPageProps) {
  const { slug } = await params;
  const supabase = await createServerSupabase();

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (clubError || !club) {
    notFound();
  }

  const [{ count: memberCount }, eventsResult, announcementsResult, officersResult] = await Promise.all([
    supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", club.id),
    supabase
      .from("events")
      .select("id, title, starts_at, location")
      .eq("club_id", club.id)
      .eq("is_published", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("announcements")
      .select("id, title, body, created_at")
      .eq("club_id", club.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("memberships")
      .select("user_id, role")
      .eq("club_id", club.id)
      .in("role", ["officer", "admin"])
      .order("role", { ascending: false }),
  ]);

  const events = (eventsResult.data ?? []) as EventPreview[];
  const announcements = (announcementsResult.data ?? []) as AnnouncementPreview[];
  const officerMemberships = (officersResult.data ?? []) as OfficerMembership[];
  const officerIds = officerMemberships.map((membership) => membership.user_id);

  let officerProfiles: OfficerProfile[] = [];

  if (officerIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, email")
      .in("id", officerIds);

    officerProfiles = (data ?? []) as OfficerProfile[];
  }

  const officerDisplayNames = officerMemberships.map((membership) => {
    const profile = officerProfiles.find((item) => item.id === membership.user_id);
    const label = profile?.display_name || profile?.email || "Unknown Member";
    return { label, role: membership.role };
  });

  const typedClub = club as Club;

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="relative overflow-hidden bg-zinc-900 text-white">
        {typedClub.cover_image_url ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${typedClub.cover_image_url})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/60 via-sky-500/40 to-cyan-400/30" />
        )}

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-200">{typedClub.category ?? "Other"}</p>
          <h1 className="text-4xl font-bold">{typedClub.name}</h1>
          <p className="text-zinc-200">{memberCount ?? 0} members</p>
          <div>
            <JoinButton clubId={typedClub.id} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold text-zinc-900">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-zinc-700">{typedClub.description || "No description provided."}</p>

          <div className="mt-5 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-zinc-900">Meeting Info:</span>{" "}
              {typedClub.meeting_info || "Not provided"}
            </p>
            <p>
              <span className="font-semibold text-zinc-900">Contact Email:</span>{" "}
              {typedClub.contact_email || "Not provided"}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-zinc-900">Officers & Admins</h2>
          {officerDisplayNames.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No officers listed.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {officerDisplayNames.map((officer, index) => (
                <li key={`${officer.label}-${index}`} className="flex items-center justify-between text-sm text-zinc-700">
                  <span>{officer.label}</span>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs font-semibold uppercase text-zinc-600">
                    {officer.role}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5 lg:col-span-2">
          <h2 className="text-xl font-semibold text-zinc-900">Upcoming Events</h2>
          {events.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No upcoming events.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg border border-zinc-200 p-3">
                  <Link href={`/events/${event.id}`} className="font-semibold text-zinc-900 hover:underline">
                    {event.title}
                  </Link>
                  <p className="mt-1 text-sm text-zinc-600">{formatDate(event.starts_at)}</p>
                  <p className="text-sm text-zinc-600">{event.location || "Location TBA"}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-zinc-900">Announcements</h2>
          {announcements.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-600">No announcements yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {announcements.map((announcement) => (
                <li key={announcement.id} className="rounded-lg border border-zinc-200 p-3">
                  <p className="font-semibold text-zinc-900">{announcement.title}</p>
                  <p className="mt-1 text-sm text-zinc-600">{announcement.body || "No details provided."}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatDate(announcement.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
