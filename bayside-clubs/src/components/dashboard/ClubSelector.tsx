"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type ClubOption = {
  id: string;
  name: string;
};

type ClubSelectorProps = {
  clubs: ClubOption[];
  selectedClubId: string;
};

export default function ClubSelector({ clubs, selectedClubId }: ClubSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (clubs.length <= 1) {
    return null;
  }

  const handleChange = (clubId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("club", clubId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex w-full max-w-sm flex-col gap-2 text-sm font-medium text-zinc-700">
      Manage club
      <select
        value={selectedClubId}
        onChange={(event) => handleChange(event.target.value)}
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
      >
        {clubs.map((club) => (
          <option key={club.id} value={club.id}>
            {club.name}
          </option>
        ))}
      </select>
    </label>
  );
}
