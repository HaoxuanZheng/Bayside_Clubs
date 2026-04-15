import EventCard from "@/components/events/EventCard";
import { createServerSupabase } from "@/lib/supabase/server";

type EventRow = {
  id: string;
  club_id: string;
  title: string;
  location: string | null;
  starts_at: string;
  capacity: number | null;
};

type ClubRow = {
  id: string;
  name: string;
  slug: string;
};

type EventWithClub = EventRow & {
  club_name: string;
  club_slug: string;
  registration_count: number;
};

type EventGroupName = "This Week" | "Next Week" | "Later";

type GroupedEvents = Record<EventGroupName, EventWithClub[]>;

function startOfWeek(value: Date): Date {
  const start = new Date(value);
  const day = start.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + offset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getWeekGroup(startsAt: string): EventGroupName {
  const now = new Date();
  const thisWeekStart = startOfWeek(now);
  const nextWeekStart = new Date(thisWeekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  const laterStart = new Date(nextWeekStart);
  laterStart.setDate(laterStart.getDate() + 7);

  const eventDate = new Date(startsAt);

  if (eventDate < nextWeekStart) {
    return "This Week";
  }

  if (eventDate < laterStart) {
    return "Next Week";
  }

  return "Later";
}

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

function getSpotsLabel(capacity: number | null, confirmedCount: number): string {
  if (capacity === null) {
    return "Unlimited";
  }

  const remaining = capacity - confirmedCount;

  if (remaining <= 0) {
    return "Full";
  }

  return `${remaining} spots left`;
}

export default async function EventsPage() {
  const supabase = await createServerSupabase();

  const [{ data: eventRows, error: eventError }, { data: clubRows, error: clubError }] = await Promise.all([
    supabase
      .from("events")
      .select("id, club_id, title, location, starts_at, capacity")
      .eq("is_published", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true }),
    supabase.from("clubs").select("id, name, slug"),
  ]);

  if (eventError || clubError) {
    console.error("Failed to load events page:", eventError ?? clubError);
  }

  const events = (eventRows ?? []) as EventRow[];
  const clubs = (clubRows ?? []) as ClubRow[];
  const clubById = new Map(clubs.map((club) => [club.id, club]));

  const registrationCounts = events.length
    ? await supabase
        .from("registrations")
        .select("event_id, status")
        .in("event_id", events.map((event) => event.id))
        .eq("status", "confirmed")
    : { data: [], error: null };

  if (registrationCounts.error) {
    console.error("Failed to load registration counts:", registrationCounts.error);
  }

  const confirmedCountByEventId = (registrationCounts.data ?? []).reduce<Record<string, number>>(
    (counts, registration) => {
      counts[registration.event_id] = (counts[registration.event_id] ?? 0) + 1;
      return counts;
    },
    {},
  );

  const groupedEvents: GroupedEvents = {
    "This Week": [],
    "Next Week": [],
    Later: [],
  };

  const combinedEvents: EventWithClub[] = events
    .map((event) => {
      const club = clubById.get(event.club_id);

      if (!club) {
        return null;
      }

      return {
        ...event,
        club_name: club.name,
        club_slug: club.slug,
        registration_count: confirmedCountByEventId[event.id] ?? 0,
      };
    })
    .filter((event): event is EventWithClub => event !== null);

  for (const event of combinedEvents) {
    const group = getWeekGroup(event.starts_at);
    groupedEvents[group].push(event);
  }

  const orderedGroups: Array<{ label: EventGroupName; events: EventWithClub[] }> = [
    { label: "This Week", events: groupedEvents["This Week"] },
    { label: "Next Week", events: groupedEvents["Next Week"] },
    { label: "Later", events: groupedEvents.Later },
  ];

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto w-full max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">Upcoming Events</h1>
        <p className="mt-2 text-zinc-600">Browse all published events happening soon.</p>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {combinedEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
            No upcoming events. Check back soon!
          </div>
        ) : (
          <div className="space-y-8">
            {orderedGroups.map(({ label, events }) =>
              events.length > 0 ? (
                <section key={label} className="space-y-4">
                  <h2 className="text-lg font-semibold text-zinc-900">{label}</h2>
                  <div className="space-y-4">
                    {events.map((event) => {
                      const { dateLabel, timeLabel } = formatDateTime(event.starts_at);

                      return (
                        <EventCard
                          key={event.id}
                          eventId={event.id}
                          dateLabel={dateLabel}
                          timeLabel={timeLabel}
                          title={event.title}
                          clubName={event.club_name}
                          clubSlug={event.club_slug}
                          location={event.location}
                          spotsRemainingLabel={getSpotsLabel(event.capacity, event.registration_count)}
                        />
                      );
                    })}
                  </div>
                </section>
              ) : null,
            )}
          </div>
        )}
      </section>
    </main>
  );
}
