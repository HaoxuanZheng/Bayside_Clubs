"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ClubCategory, ProfileRole } from "@/lib/types";
import {
  createClub,
  deactivateUser,
  makeClubAdminByEmail,
  makeSystemAdmin,
  removeClubAdmin,
  toggleClubActive,
} from "@/lib/actions/admin";
import { Badge, Button, Card, Input } from "@/components/ui";

type PlatformStats = {
  totalUsers: number;
  totalClubs: number;
  totalUpcomingEvents: number;
  totalRegistrationsThisMonth: number;
};

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
  memberCount: number;
  eventCount: number;
  is_active: boolean;
};

type ClubAdminRow = {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  clubId: string;
  clubName: string;
};

type SystemAdminPanelProps = {
  stats: PlatformStats;
  users: UserRow[];
  clubs: ClubRow[];
  clubAdmins: ClubAdminRow[];
};

const USERS_PER_PAGE = 20;

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateString));
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function SystemAdminPanel({
  stats,
  users,
  clubs,
  clubAdmins,
}: SystemAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [clubName, setClubName] = useState<string>("");
  const [clubSlug, setClubSlug] = useState<string>("");
  const [slugTouched, setSlugTouched] = useState<boolean>(false);
  const [clubDescription, setClubDescription] = useState<string>("");
  const [clubCategory, setClubCategory] = useState<ClubCategory | "">("");
  const [meetingInfo, setMeetingInfo] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");

  const [selectedClubId, setSelectedClubId] = useState<string>(clubs[0]?.id ?? "");
  const [adminEmail, setAdminEmail] = useState<string>("");
  const [userQuery, setUserQuery] = useState<string>("");
  const [userPage, setUserPage] = useState<number>(1);

  const filteredUsers = useMemo(() => {
    const normalized = userQuery.trim().toLowerCase();
    if (!normalized) {
      return users;
    }
    return users.filter((user) => {
      const displayName = user.display_name?.toLowerCase() ?? "";
      return (
        user.email.toLowerCase().includes(normalized) ||
        displayName.includes(normalized)
      );
    });
  }, [users, userQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, userPage]);

  const setMessage = (nextSuccess: string | null, nextError: string | null) => {
    setSuccessMessage(nextSuccess);
    setErrorMessage(nextError);
  };

  const handleCreateClub = () => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await createClub({
        name: clubName,
        slug: clubSlug,
        description: clubDescription,
        category: clubCategory || null,
        meeting_info: meetingInfo,
        contact_email: contactEmail,
      });

      if (!result.success) {
        setMessage(null, result.error ?? "Unable to create club");
        return;
      }

      setClubName("");
      setClubSlug("");
      setSlugTouched(false);
      setClubDescription("");
      setClubCategory("");
      setMeetingInfo("");
      setContactEmail("");
      setMessage("Club created successfully", null);
      router.refresh();
    });
  };

  const handleMakeClubAdmin = () => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await makeClubAdminByEmail(adminEmail, selectedClubId);
      if (!result.success) {
        setMessage(null, result.error ?? "Unable to assign club admin");
        return;
      }

      setAdminEmail("");
      setMessage("Club admin assigned", null);
      router.refresh();
    });
  };

  const handleRemoveClubAdmin = (membershipId: string) => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await removeClubAdmin(membershipId);
      if (!result.success) {
        setMessage(null, result.error ?? "Unable to remove club admin");
        return;
      }

      setMessage("Club admin removed", null);
      router.refresh();
    });
  };

  const handleMakeSystemAdmin = (userId: string) => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await makeSystemAdmin(userId);
      if (!result.success) {
        setMessage(null, result.error ?? "Unable to promote user");
        return;
      }

      setMessage("User promoted to system admin", null);
      router.refresh();
    });
  };

  const handleDeactivateUser = (userId: string) => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await deactivateUser(userId);
      if (!result.success) {
        setMessage(null, result.error ?? "Unable to deactivate user");
        return;
      }

      setMessage("User deactivated", null);
      router.refresh();
    });
  };

  const handleToggleClubActive = (clubId: string, nextValue: boolean) => {
    setMessage(null, null);
    startTransition(async () => {
      const result = await toggleClubActive(clubId, nextValue);
      if (!result.success) {
        setMessage(null, result.error ?? "Unable to update club status");
        return;
      }

      setMessage("Club status updated", null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total users</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalUsers}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Total clubs</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{stats.totalClubs}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Upcoming events</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalUpcomingEvents}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-slate-500">Registrations this month</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {stats.totalRegistrationsThisMonth}
          </p>
        </Card>
      </section>

      {(errorMessage || successMessage) && (
        <div className="space-y-2">
          {errorMessage && (
            <p className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-md bg-emerald-50 px-4 py-2 text-sm text-emerald-700">
              {successMessage}
            </p>
          )}
        </div>
      )}

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Create New Club</h2>
        <p className="mt-1 text-sm text-slate-600">
          Add a new club and immediately make it available for management.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Input
            label="Club Name"
            value={clubName}
            onChange={(event) => {
              const nextName = event.target.value;
              setClubName(nextName);
              if (!slugTouched) {
                setClubSlug(toSlug(nextName));
              }
            }}
            disabled={isPending}
          />
          <Input
            label="Slug"
            value={clubSlug}
            onChange={(event) => {
              setSlugTouched(true);
              setClubSlug(toSlug(event.target.value));
            }}
            disabled={isPending}
          />
          <Input
            label="Meeting Info"
            value={meetingInfo}
            onChange={(event) => setMeetingInfo(event.target.value)}
            disabled={isPending}
          />
          <Input
            label="Contact Email"
            type="email"
            value={contactEmail}
            onChange={(event) => setContactEmail(event.target.value)}
            disabled={isPending}
          />
          <div className="space-y-1.5">
            <label htmlFor="club-category" className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <select
              id="club-category"
              value={clubCategory}
              onChange={(event) => setClubCategory(event.target.value as ClubCategory | "")}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              disabled={isPending}
            >
              <option value="">Uncategorized</option>
              <option value="Academic">Academic</option>
              <option value="Arts">Arts</option>
              <option value="Sports">Sports</option>
              <option value="Service">Service</option>
              <option value="Tech">Tech</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-1.5 lg:col-span-2">
            <label htmlFor="club-description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="club-description"
              rows={4}
              value={clubDescription}
              onChange={(event) => setClubDescription(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              disabled={isPending}
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleCreateClub} isLoading={isPending}>
            Create Club
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Manage Club Admins</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="block text-sm font-medium text-slate-700">
              Search User by Email
            </label>
            <input
              id="admin-email"
              list="admin-user-emails"
              value={adminEmail}
              onChange={(event) => setAdminEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              placeholder="student@nycstudents.net"
              disabled={isPending}
            />
            <datalist id="admin-user-emails">
              {users.map((user) => (
                <option key={user.id} value={user.email} />
              ))}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-club" className="block text-sm font-medium text-slate-700">
              Club
            </label>
            <select
              id="admin-club"
              value={selectedClubId}
              onChange={(event) => setSelectedClubId(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
              disabled={isPending}
            >
              {clubs.map((club) => (
                <option key={club.id} value={club.id}>
                  {club.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button onClick={handleMakeClubAdmin} isLoading={isPending}>
              Make Club Admin
            </Button>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Club</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clubAdmins.map((adminRow) => (
                <tr key={adminRow.membershipId}>
                  <td className="px-4 py-3 text-slate-900">{adminRow.displayName}</td>
                  <td className="px-4 py-3 text-slate-700">{adminRow.email}</td>
                  <td className="px-4 py-3 text-slate-700">{adminRow.clubName}</td>
                  <td className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveClubAdmin(adminRow.membershipId)}
                      disabled={isPending}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">All Users</h2>
        <div className="mt-4">
          <Input
            label="Search by email or name"
            value={userQuery}
            onChange={(event) => {
              setUserQuery(event.target.value);
              setUserPage(1);
            }}
            placeholder="Search users..."
            disabled={isPending}
          />
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Display Name</th>
                <th className="px-4 py-3 font-medium">Grade</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 text-slate-900">{user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{user.display_name || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{user.grade ?? "-"}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.role === "admin" ? "success" : "default"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={user.is_active ? "success" : "danger"}>
                      {user.is_active ? "active" : "deactivated"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(user.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isPending || user.role === "admin"}
                        onClick={() => handleMakeSystemAdmin(user.id)}
                      >
                        Make System Admin
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={isPending || !user.is_active}
                        onClick={() => handleDeactivateUser(user.id)}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > USERS_PER_PAGE && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserPage((page) => Math.max(1, page - 1))}
              disabled={isPending || userPage === 1}
            >
              Previous
            </Button>
            <span>
              Page {userPage} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUserPage((page) => Math.min(totalPages, page + 1))}
              disabled={isPending || userPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">All Clubs</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Events</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {clubs.map((club) => (
                <tr key={club.id}>
                  <td className="px-4 py-3 text-slate-900">{club.name}</td>
                  <td className="px-4 py-3 text-slate-700">{club.category ?? "Other"}</td>
                  <td className="px-4 py-3 text-slate-700">{club.memberCount}</td>
                  <td className="px-4 py-3 text-slate-700">{club.eventCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={club.is_active ? "success" : "danger"}>
                      {club.is_active ? "active" : "inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={club.is_active ? "danger" : "secondary"}
                      disabled={isPending}
                      onClick={() => handleToggleClubActive(club.id, !club.is_active)}
                    >
                      {club.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

