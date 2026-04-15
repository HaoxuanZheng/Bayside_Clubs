import Link from "next/link";
import { notFound } from "next/navigation";
import RegistrationPanel from "@/components/events/RegistrationPanel";
import { createServerSupabase } from "@/lib/supabase/server";

type EventPageProps = {
  params: Promise<{ id: string }>;
};

type EventRow = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  capacity: number | null;
  is_published: boolean;
};

function formatDateTime(value: string): { dateLabel: string; timeLabel: string } {
  const date = new Date(value);
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return {
    dateLabel: dateFormatter.format(date),
    timeLabel: timeFormatter.format(date),
  };
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const { id } = await params;
  const supabase = await createServerSupabase();

  const [eventResult, userResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, club_id, title, description, location, starts_at, capacity, is_published")
      .eq("id", id)
      .eq("is_published", true)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  const event = eventResult.data as EventRow | null;

  if (eventResult.error || !event || !event.is_published) {
    notFound();
  }

  const { data: club, error: clubError } = await supabase
    .from("clubs")
    .select("id, name, slug")
    .eq("id", event.club_id)
    .maybeSingle();

  if (clubError || !club) {
    notFound();
  }

  const [{ count: confirmedCount, error: countError }, { data: userRegistration }] = await Promise.all([
    supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id)
      .eq("status", "confirmed"),
    userResult.data.user
      ? supabase
          .from("registrations")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", userResult.data.user.id)
          .eq("status", "confirmed")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (countError) {
    console.error("Failed to load confirmed registration count:", countError);
  }

  const { dateLabel, timeLabel } = formatDateTime(event.starts_at);
  const isRegistered = Boolean(userRegistration);
  const isAuthenticated = Boolean(userResult.data.user);
  const attendeeCount = confirmedCount ?? 0;

  return (
    <main className="min-h-screen bg-zinc-50">
      <section className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-zinc-500">
                {dateLabel} · {timeLabel}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-zinc-900">{event.title}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
                <Link href={`/clubs/${club.slug}`} className="font-medium text-blue-700 hover:underline">
                  {club.name}
                </Link>
                <span>•</span>
                <span>{event.location || "Location TBA"}</span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Attendees</p>
                  <p className="mt-1 text-3xl font-bold text-zinc-900">{attendeeCount}</p>
                </div>
                <div className="rounded-xl bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-500">Club</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">{club.name}</p>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md">
              <RegistrationPanel
                eventId={event.id}
                capacity={event.capacity}
                confirmedCount={attendeeCount}
                isAuthenticated={isAuthenticated}
                isRegistered={isRegistered}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-semibold text-zinc-900">Description</h2>
          <p className="mt-3 whitespace-pre-wrap text-zinc-700">
            {event.description || "No description provided."}
          </p>
        </div>

        <aside className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-zinc-900">Event Info</h2>
          <dl className="mt-4 space-y-4 text-sm text-zinc-700">
            <div>
              <dt className="font-medium text-zinc-900">Date and Time</dt>
              <dd className="mt-1">
                {dateLabel} · {timeLabel}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Location</dt>
              <dd className="mt-1">{event.location || "Location TBA"}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-900">Attendance</dt>
              <dd className="mt-1">{attendeeCount}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
