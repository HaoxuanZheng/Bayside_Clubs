import Link from "next/link";
import type { ClubCategory } from "@/lib/types";

export type ClubListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ClubCategory | null;
  memberCount: number;
};

type ClubCardProps = {
  club: ClubListItem;
};

const categoryBadgeClass: Record<ClubCategory | "Other", string> = {
  Academic: "bg-blue-100 text-blue-800 border-blue-200",
  Arts: "bg-purple-100 text-purple-800 border-purple-200",
  Sports: "bg-green-100 text-green-800 border-green-200",
  Service: "bg-orange-100 text-orange-800 border-orange-200",
  Tech: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Other: "bg-gray-100 text-gray-800 border-gray-200",
};

function truncateDescription(description: string | null, maxChars = 100): string {
  if (!description) {
    return "No description yet.";
  }

  if (description.length <= maxChars) {
    return description;
  }

  return `${description.slice(0, maxChars).trimEnd()}...`;
}

export default function ClubCard({ club }: ClubCardProps) {
  const category: ClubCategory | "Other" = club.category ?? "Other";

  return (
    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-zinc-900">{club.name}</h3>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryBadgeClass[category]}`}
        >
          {category}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-6 text-zinc-600">{truncateDescription(club.description)}</p>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-700">{club.memberCount} members</p>
        <Link
          href={`/clubs/${club.slug}`}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
        >
          View Club
        </Link>
      </div>
    </article>
  );
}
