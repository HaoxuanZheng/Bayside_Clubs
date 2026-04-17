"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClubCategory, MembershipRole } from "@/lib/types";
import { promoteClubMember, removeClubMember, updateClub } from "@/lib/actions/dashboard";
import { deleteEvent } from "@/lib/actions/events";

type ClubSettings = {
  description: string | null;
  meeting_info: string | null;
  contact_email: string | null;
  category: ClubCategory | null;
};

type SelectedClub = {
  id: string;
  name: string;
  slug: string;
};

type MemberRow = {
  membershipId: string;
  displayName: string;
  grade: number | null;
  joinedAt: string;
  role: MembershipRole;
};

type EventRow = {
  id: string;
  title: string;
  startsAt: string;
  registrationCount: number;
  capacity: number | null;
  isPublished: boolean;
};

type RecentRegistration = {
  id: string;
  eventTitle: string;
  registeredAt: string;
};

type ClubAdminDashboardProps = {
  selectedClub: SelectedClub;
  stats: {
    totalMembers: number;
    upcomingEvents: number;
    thisWeeksRegistrations: number;
  };
  members: MemberRow[];
  events: EventRow[];
  recentRegistrations: RecentRegistration[];
  settings: ClubSettings;
};

const TAB_KEYS = ["members", "events", "settings"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const CATEGORY_OPTIONS: Array<{ label: string; value: ClubCategory | "" }> = [
  { label: "Uncategorized", value: "" },
  { label: "Academic", value: "Academic" },
  { label: "Arts", value: "Arts" },
  { label: "Sports", value: "Sports" },
  { label: "Service", value: "Service" },
  { label: "Tech", value: "Tech" },
  { label: "Other", value: "Other" },
];

const MEMBERS_PER_PAGE = 20;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatCompactDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ClubAdminDashboard({
  selectedClub,
  stats,
  members,
  events,
  recentRegistrations,
  settings,
}: ClubAdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("members");
  const [memberPage, setMemberPage] = useState(1);
  const [description, setDescription] = useState(settings.description ?? "");
  const [meetingInfo, setMeetingInfo] = useState(settings.meeting_info ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contact_email ?? "");
  const [category, setCategory] = useState<ClubCategory | "">(settings.category ?? "");
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const totalMemberPages = Math.max(1, Math.ceil(members.length / MEMBERS_PER_PAGE));
  const paginatedMembers = useMemo(() => {
    const start = (memberPage - 1) * MEMBERS_PER_PAGE;
    return members.slice(start, start + MEMBERS_PER_PAGE);
  }, [memberPage, members]);

  const handleRemoveMember = (membershipId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await removeClubMember(membershipId, selectedClub.id);
      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to remove member");
        return;
      }

      router.refresh();
    });
  };

  const handlePromoteMember = (membershipId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await promoteClubMember(membershipId, selectedClub.id);
      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to promote member");
        return;
      }

      router.refresh();
    });
  };

  const handleSaveClub = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await updateClub(selectedClub.id, {
        description,
        meeting_info: meetingInfo,
        contact_email: contactEmail,
        category: category || null,
      });

      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to save club settings");
        return;
      }

      setSuccessMessage("Club settings saved");
      router.refresh();
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to delete event");
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Total members</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.totalMembers}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">Upcoming events</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.upcomingEvents}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-zinc-500">This week&apos;s registrations</p>
          <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.thisWeeksRegistrations}</p>
        </div>
      </section>

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
      )}
      {successMessage && (
        <p className="mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</p>
      )}

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-zinc-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">{selectedClub.name} Dashboard</h2>
            <p className="mt-1 text-sm text-zinc-600">Manage members, events, and club settings.</p>
          </div>

          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Create New Event
          </Link>
        </div>

        <div className="border-b border-zinc-200 px-5">
          <div className="flex gap-2 overflow-x-auto py-3 text-sm font-medium">
            {TAB_KEYS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 transition ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {tab === "members" ? "Members" : tab === "events" ? "Events" : "Club Settings"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === "members" && (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-50 text-left text-zinc-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Display name</th>
                      <th className="px-4 py-3 font-medium">Grade</th>
                      <th className="px-4 py-3 font-medium">Joined date</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {paginatedMembers.map((member) => (
                      <tr key={member.membershipId}>
                        <td className="px-4 py-3 font-medium text-zinc-900">{member.displayName}</td>
                        <td className="px-4 py-3 text-zinc-700">{member.grade ?? "-"}</td>
                        <td className="px-4 py-3 text-zinc-700">{formatDate(member.joinedAt)}</td>
                        <td className="px-4 py-3 text-zinc-700">{member.role}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.membershipId)}
                              disabled={isPending}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Remove
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePromoteMember(member.membershipId)}
                              disabled={isPending || member.role === "officer" || member.role === "admin"}
                              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Promote to Officer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {members.length > MEMBERS_PER_PAGE && (
                <div className="flex items-center justify-between text-sm text-zinc-600">
                  <button
                    type="button"
                    onClick={() => setMemberPage((value) => Math.max(1, value - 1))}
                    disabled={memberPage === 1}
                    className="rounded-md border border-zinc-300 px-3 py-2 font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Previous
                  </button>
                  <span>
                    Page {memberPage} of {totalMemberPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMemberPage((value) => Math.min(totalMemberPages, value + 1))}
                    disabled={memberPage === totalMemberPages}
                    className="rounded-md border border-zinc-300 px-3 py-2 font-medium transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-6">
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-zinc-200 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold text-zinc-900">{event.title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${event.isPublished ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                            {event.isPublished ? "Published" : "Unpublished"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-zinc-600">{formatEventDate(event.startsAt)}</p>
                        <p className="mt-1 text-sm text-zinc-600">
                          {event.registrationCount}
                          {event.capacity === null ? " registrations / Unlimited" : ` registrations / ${event.capacity}`}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/dashboard/events/${event.id}/edit`}
                          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={isPending}
                          className="rounded-md border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <h3 className="text-lg font-semibold text-zinc-900">Recent registrations</h3>
                {recentRegistrations.length === 0 ? (
                  <p className="mt-2 text-sm text-zinc-600">No recent registrations.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {recentRegistrations.map((registration) => (
                      <li key={registration.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-zinc-700">
                        <span>{registration.eventTitle}</span>
                        <span className="text-zinc-500">{formatCompactDateTime(registration.registeredAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <form onSubmit={handleSaveClub} className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="description">
                  Club description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="meetingInfo">
                  Meeting info
                </label>
                <input
                  id="meetingInfo"
                  value={meetingInfo}
                  onChange={(event) => setMeetingInfo(event.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="contactEmail">
                  Contact email
                </label>
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="category">
                  Category
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value as ClubCategory | "")}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
