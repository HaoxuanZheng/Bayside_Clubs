"use client";

import { useMemo, useState } from "react";
import ClubCard, { type ClubListItem } from "@/components/clubs/ClubCard";
import type { ClubCategory } from "@/lib/types";

type ClubGridProps = {
  clubs: ClubListItem[];
};

type CategoryFilter = "All" | ClubCategory;

const categoryFilters: CategoryFilter[] = [
  "All",
  "Academic",
  "Arts",
  "Sports",
  "Service",
  "Tech",
  "Other",
];

export default function ClubGrid({ clubs }: ClubGridProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredClubs = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return clubs.filter((club) => {
      const categoryMatches =
        selectedCategory === "All" ||
        (selectedCategory === "Other" ? (club.category ?? "Other") === "Other" : club.category === selectedCategory);

      const nameMatches = club.name.toLowerCase().includes(normalizedQuery);

      return categoryMatches && nameMatches;
    });
  }, [clubs, selectedCategory, searchQuery]);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((category) => {
            const isActive = selectedCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <div>
          <label htmlFor="club-search" className="sr-only">
            Search clubs
          </label>
          <input
            id="club-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by club name"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
      </div>

      {filteredClubs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-zinc-600">
          No clubs match your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </section>
  );
}
