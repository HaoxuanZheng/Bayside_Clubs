import Link from "next/link";

type EventCardProps = {
  eventId: string;
  dateLabel: string;
  timeLabel: string;
  title: string;
  clubName: string;
  clubSlug: string;
  location: string | null;
  spotsRemainingLabel: string;
};

export default function EventCard({
  eventId,
  dateLabel,
  timeLabel,
  title,
  clubName,
  clubSlug,
  location,
  spotsRemainingLabel,
}: EventCardProps) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {dateLabel} · {timeLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-zinc-900">{title}</h2>
          <Link href={`/clubs/${clubSlug}`} className="mt-2 inline-flex text-sm font-medium text-blue-700 hover:underline">
            {clubName}
          </Link>
          <p className="mt-1 text-sm text-zinc-600">{location || "Location TBA"}</p>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-700">
            {spotsRemainingLabel}
          </span>

          <Link
            href={`/events/${eventId}`}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            View Event
          </Link>
        </div>
      </div>
    </article>
  );
}
