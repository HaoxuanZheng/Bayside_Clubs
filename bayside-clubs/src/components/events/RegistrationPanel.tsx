"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cancelRegistration, registerForEvent } from "@/lib/actions/events";

type RegistrationPanelProps = {
  eventId: string;
  capacity: number | null;
  confirmedCount: number;
  isAuthenticated: boolean;
  isRegistered: boolean;
};

export default function RegistrationPanel({
  eventId,
  capacity,
  confirmedCount,
  isAuthenticated,
  isRegistered,
}: RegistrationPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentRegistered, setCurrentRegistered] = useState<boolean>(isRegistered);
  const [currentConfirmedCount, setCurrentConfirmedCount] = useState<number>(confirmedCount);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFull = useMemo(() => {
    if (capacity === null) {
      return false;
    }

    return currentConfirmedCount >= capacity;
  }, [capacity, currentConfirmedCount]);

  const spotsLabel = useMemo(() => {
    if (capacity === null) {
      return "Unlimited spots";
    }

    const filled = Math.min(currentConfirmedCount, capacity);
    return `${filled} of ${capacity} spots filled`;
  }, [capacity, currentConfirmedCount]);

  const progressPercent = useMemo(() => {
    if (capacity === null || capacity === 0) {
      return 0;
    }

    return Math.min(100, Math.round((currentConfirmedCount / capacity) * 100));
  }, [capacity, currentConfirmedCount]);

  const handleRegister = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await registerForEvent(eventId);
      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to register");
        return;
      }

      setCurrentRegistered(true);
      setCurrentConfirmedCount((value) => value + 1);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await cancelRegistration(eventId);
      if (!result.success) {
        setErrorMessage(result.error ?? "Unable to cancel registration");
        return;
      }

      setCurrentRegistered(false);
      setCurrentConfirmedCount((value) => Math.max(0, value - 1));
      router.refresh();
    });
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">Registration</h2>
          <p className="mt-1 text-sm text-zinc-600">{spotsLabel}</p>
        </div>

        <span className="text-sm font-medium text-zinc-700">{currentConfirmedCount} attendees</span>
      </div>

      {capacity !== null && (
        <div className="mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      )}

      <div className="mt-4">
        {!isAuthenticated ? (
          <Link
            href={`/login?from=${encodeURIComponent(`/events/${eventId}`)}`}
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            Login to register
          </Link>
        ) : currentRegistered ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="text-sm font-medium text-emerald-700">You are registered ✓</p>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Processing..." : "Cancel Registration"}
            </button>
          </div>
        ) : isFull ? (
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed rounded-md bg-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-500"
          >
            This event is full
          </button>
        ) : (
          <button
            type="button"
            onClick={handleRegister}
            disabled={isPending}
            className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Processing..." : "Register for this event"}
          </button>
        )}
      </div>
    </section>
  );
}
