"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { EventInsert } from "@/lib/types";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { Button, Input } from "@/components/ui";

type ClubOption = {
  id: string;
  name: string;
};

type EventInitialData = {
  id: string;
  club_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  capacity: number | null;
  is_published: boolean;
};

type EventFormProps = {
  mode: "create" | "edit";
  clubOptions: ClubOption[];
  initialData?: EventInitialData;
};

function toDateInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInput(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

type ValidationResult = {
  ok: boolean;
  message?: string;
  payload?: EventInsert;
};

function buildPayload(values: {
  clubId: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  startTime: string;
  endTime: string;
  capacity: string;
  isPublished: boolean;
}): ValidationResult {
  if (!values.clubId) {
    return { ok: false, message: "Please select a club" };
  }

  const normalizedTitle = values.title.trim();
  if (!normalizedTitle) {
    return { ok: false, message: "Title is required" };
  }

  if (!values.startDate || !values.startTime) {
    return { ok: false, message: "Start date and start time are required" };
  }

  const startsAt = new Date(`${values.startDate}T${values.startTime}`);
  if (Number.isNaN(startsAt.getTime())) {
    return { ok: false, message: "Invalid start date/time" };
  }

  if (startsAt.getTime() <= Date.now()) {
    return { ok: false, message: "Start date/time must be in the future" };
  }

  let endsAtIso: string | null = null;
  if (values.endTime.trim()) {
    const endsAt = new Date(`${values.startDate}T${values.endTime.trim()}`);
    if (Number.isNaN(endsAt.getTime())) {
      return { ok: false, message: "Invalid end time" };
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      return { ok: false, message: "End time must be after start time" };
    }
    endsAtIso = endsAt.toISOString();
  }

  let capacity: number | null = null;
  if (values.capacity.trim()) {
    const parsed = Number(values.capacity.trim());
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return { ok: false, message: "Capacity must be a positive integer" };
    }
    capacity = parsed;
  }

  return {
    ok: true,
    payload: {
      club_id: values.clubId,
      title: normalizedTitle,
      description: values.description.trim() || null,
      location: values.location.trim() || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAtIso,
      capacity,
      is_published: values.isPublished,
    },
  };
}

export default function EventForm({ mode, clubOptions, initialData }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [clubId, setClubId] = useState<string>(
    initialData?.club_id ?? clubOptions[0]?.id ?? "",
  );
  const [title, setTitle] = useState<string>(initialData?.title ?? "");
  const [description, setDescription] = useState<string>(initialData?.description ?? "");
  const [location, setLocation] = useState<string>(initialData?.location ?? "");
  const [startDate, setStartDate] = useState<string>(
    initialData?.starts_at ? toDateInput(initialData.starts_at) : "",
  );
  const [startTime, setStartTime] = useState<string>(
    initialData?.starts_at ? toTimeInput(initialData.starts_at) : "",
  );
  const [endTime, setEndTime] = useState<string>(
    initialData?.ends_at ? toTimeInput(initialData.ends_at) : "",
  );
  const [capacity, setCapacity] = useState<string>(
    initialData?.capacity === null || initialData?.capacity === undefined
      ? ""
      : String(initialData.capacity),
  );
  const [isPublished, setIsPublished] = useState<boolean>(
    initialData?.is_published ?? false,
  );

  const titleText = mode === "create" ? "Create New Event" : "Edit Event";
  const submitText = mode === "create" ? "Create Event" : "Save Changes";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const result = buildPayload({
      clubId,
      title,
      description,
      location,
      startDate,
      startTime,
      endTime,
      capacity,
      isPublished,
    });

    if (!result.ok || !result.payload) {
      setErrorMessage(result.message ?? "Invalid event data");
      return;
    }

    const payload = result.payload;

    startTransition(async () => {
      const actionResult =
        mode === "create"
          ? await createEvent(payload)
          : await updateEvent(initialData?.id ?? "", payload);

      if (!actionResult.success) {
        setErrorMessage(actionResult.error ?? "Unable to save event");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">{titleText}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Fill in the details below. Students only see events that are published.
      </p>

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="clubId" className="block text-sm font-medium text-slate-700">
            Club
          </label>
          <select
            id="clubId"
            value={clubId}
            onChange={(event) => setClubId(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
            disabled={isPending}
          >
            {clubOptions.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Club Meeting"
          disabled={isPending}
          required
        />

        <div className="space-y-1.5">
          <label htmlFor="description" className="block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-[#1E3A5F] focus:outline-none focus:ring-1 focus:ring-[#1E3A5F]"
            disabled={isPending}
          />
        </div>

        <Input
          label="Location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Room 301"
          disabled={isPending}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            disabled={isPending}
            required
          />
          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            disabled={isPending}
            required
          />
        </div>

        <Input
          label="End Time (Optional)"
          type="time"
          value={endTime}
          onChange={(event) => setEndTime(event.target.value)}
          disabled={isPending}
        />

        <Input
          label="Capacity (Optional)"
          type="number"
          min={1}
          step={1}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          helperText="Leave blank for unlimited spots."
          disabled={isPending}
        />

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(event) => setIsPublished(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-[#1E3A5F] focus:ring-[#1E3A5F]"
            disabled={isPending}
          />
          Published (visible to students)
        </label>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" isLoading={isPending}>
            {submitText}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            disabled={isPending}
          >
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
