"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { EventInsert } from "@/lib/types";

type ActionResult = {
  success: boolean;
  error?: string;
};

type EventActionResult = ActionResult & {
  eventId?: string;
};

type RegistrationStatus = "confirmed" | "cancelled";
type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

type CurrentUserContext =
  | {
      userId: string;
      isSystemAdmin: boolean;
    }
  | {
      userId: null;
      isSystemAdmin: false;
      error: string;
    };

async function getCurrentUserContext(
  supabase: SupabaseServerClient,
): Promise<CurrentUserContext> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { userId: null, isSystemAdmin: false, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { userId: null, isSystemAdmin: false, error: profileError.message };
  }

  return {
    userId: user.id,
    isSystemAdmin: profile?.role === "admin",
  };
}

function revalidateEventPaths(eventId: string): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/events/new");
  revalidatePath("/dashboard/events/[id]/edit", "page");
  revalidatePath(`/dashboard/events/${eventId}/edit`);
  revalidatePath("/events");
  revalidatePath("/events/[id]", "page");
  revalidatePath(`/events/${eventId}`);
}

async function canManageClub(
  supabase: SupabaseServerClient,
  userId: string,
  clubId: string,
  isSystemAdmin: boolean,
): Promise<ActionResult> {
  if (isSystemAdmin) {
    return { success: true };
  }

  const { data, error } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, error: "Not authorized" };
  }

  return { success: true };
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validateStartsEnds(
  startsAt: string,
  endsAt: string | null,
): ActionResult & { startsAtDate?: Date; endsAtDate?: Date | null } {
  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    return { success: false, error: "Invalid start date" };
  }

  if (startsAtDate.getTime() <= Date.now()) {
    return { success: false, error: "Start date must be in the future" };
  }

  if (!endsAt) {
    return { success: true, startsAtDate, endsAtDate: null };
  }

  const endsAtDate = new Date(endsAt);
  if (Number.isNaN(endsAtDate.getTime())) {
    return { success: false, error: "Invalid end date" };
  }

  if (endsAtDate.getTime() <= startsAtDate.getTime()) {
    return { success: false, error: "End time must be after start time" };
  }

  return { success: true, startsAtDate, endsAtDate };
}

function validateCapacity(capacity: number | null | undefined): ActionResult {
  if (capacity === null || capacity === undefined) {
    return { success: true };
  }

  if (!Number.isInteger(capacity) || capacity <= 0) {
    return { success: false, error: "Capacity must be a positive integer" };
  }

  return { success: true };
}

export async function createEvent(formData: EventInsert): Promise<EventActionResult> {
  const normalizedTitle = formData.title?.trim() ?? "";
  if (!normalizedTitle) {
    return { success: false, error: "Title is required" };
  }

  const timingValidation = validateStartsEnds(formData.starts_at, formData.ends_at ?? null);
  if (!timingValidation.success) {
    return { success: false, error: timingValidation.error };
  }

  const capacityValidation = validateCapacity(formData.capacity);
  if (!capacityValidation.success) {
    return capacityValidation;
  }

  const supabase = await createServerSupabase();
  const currentUser = await getCurrentUserContext(supabase);
  if (currentUser.userId === null) {
    return { success: false, error: currentUser.error };
  }

  const authz = await canManageClub(
    supabase,
    currentUser.userId,
    formData.club_id,
    currentUser.isSystemAdmin,
  );
  if (!authz.success) {
    return authz;
  }

  const payload = {
    club_id: formData.club_id,
    title: normalizedTitle,
    description: normalizeOptionalText(formData.description),
    location: normalizeOptionalText(formData.location),
    starts_at: timingValidation.startsAtDate?.toISOString() ?? formData.starts_at,
    ends_at: timingValidation.endsAtDate?.toISOString() ?? null,
    capacity: formData.capacity ?? null,
    is_published: formData.is_published ?? false,
    created_by: currentUser.userId,
  };

  const { data: createdEvent, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/events");
  revalidatePath("/clubs");

  return { success: true, eventId: createdEvent.id };
}

export async function updateEvent(
  eventId: string,
  formData: Partial<EventInsert>,
): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, error: "Invalid event id" };
  }

  const supabase = await createServerSupabase();
  const currentUser = await getCurrentUserContext(supabase);
  if (currentUser.userId === null) {
    return { success: false, error: currentUser.error };
  }

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("events")
    .select("id, club_id, title, starts_at, ends_at, capacity")
    .eq("id", eventId)
    .maybeSingle();

  if (existingEventError) {
    return { success: false, error: existingEventError.message };
  }

  if (!existingEvent) {
    return { success: false, error: "Event not found" };
  }

  const targetClubId = formData.club_id ?? existingEvent.club_id;
  const authz = await canManageClub(
    supabase,
    currentUser.userId,
    targetClubId,
    currentUser.isSystemAdmin,
  );
  if (!authz.success) {
    return authz;
  }

  const title = formData.title ? formData.title.trim() : existingEvent.title;
  if (!title) {
    return { success: false, error: "Title is required" };
  }

  const startsAt = formData.starts_at ?? existingEvent.starts_at;
  const endsAt =
    formData.ends_at === undefined ? existingEvent.ends_at : formData.ends_at;
  const capacity =
    formData.capacity === undefined ? existingEvent.capacity : formData.capacity;

  const timingValidation = validateStartsEnds(startsAt, endsAt ?? null);
  if (!timingValidation.success) {
    return { success: false, error: timingValidation.error };
  }

  const capacityValidation = validateCapacity(capacity ?? null);
  if (!capacityValidation.success) {
    return capacityValidation;
  }

  const payload = {
    club_id: targetClubId,
    title,
    description:
      formData.description === undefined
        ? undefined
        : normalizeOptionalText(formData.description),
    location:
      formData.location === undefined
        ? undefined
        : normalizeOptionalText(formData.location),
    starts_at:
      timingValidation.startsAtDate?.toISOString() ?? startsAt,
    ends_at:
      formData.ends_at === undefined
        ? undefined
        : timingValidation.endsAtDate?.toISOString() ?? null,
    capacity: capacity ?? null,
    is_published: formData.is_published,
  };

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", eventId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateEventPaths(eventId);
  revalidatePath("/clubs");
  return { success: true };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, error: "Invalid event id" };
  }

  const supabase = await createServerSupabase();
  const currentUser = await getCurrentUserContext(supabase);
  if (currentUser.userId === null) {
    return { success: false, error: currentUser.error };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, club_id")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return { success: false, error: eventError.message };
  }

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  const authz = await canManageClub(
    supabase,
    currentUser.userId,
    event.club_id,
    currentUser.isSystemAdmin,
  );
  if (!authz.success) {
    return authz;
  }

  const { count: confirmedCount, error: countError } = await supabase
    .from("registrations")
    .select("id", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if (countError) {
    return { success: false, error: countError.message };
  }

  if ((confirmedCount ?? 0) > 0) {
    return {
      success: false,
      error: "Cannot delete an event with confirmed registrations",
    };
  }

  const { error: deleteError } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidateEventPaths(eventId);
  return { success: true };
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, error: "Invalid event id" };
  }

  const supabase = await createServerSupabase();
  const currentUser = await getCurrentUserContext(supabase);
  if (currentUser.userId === null) {
    return { success: false, error: currentUser.error };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, is_published")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError) {
    return { success: false, error: eventError.message };
  }

  if (!event) {
    return { success: false, error: "Event not found" };
  }

  if (!event.is_published) {
    return { success: false, error: "Event is not published" };
  }

  const { data: existingRegistration, error: existingRegistrationError } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", currentUser.userId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (existingRegistrationError) {
    return { success: false, error: existingRegistrationError.message };
  }

  if (existingRegistration) {
    return { success: false, error: "Already registered" };
  }

  const { data, error } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (data?.error) {
    return { success: false, error: String(data.error) };
  }

  revalidateEventPaths(eventId);

  return { success: true };
}

export async function cancelRegistration(eventId: string): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, error: "Invalid event id" };
  }

  const supabase = await createServerSupabase();
  const currentUser = await getCurrentUserContext(supabase);
  if (currentUser.userId === null) {
    return { success: false, error: currentUser.error };
  }

  const { data: registration, error: registrationError } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", currentUser.userId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (registrationError) {
    return { success: false, error: registrationError.message };
  }

  if (!registration) {
    return { success: false, error: "You are not registered" };
  }

  const { error } = await supabase
    .from("registrations")
    .update({ status: "cancelled" satisfies RegistrationStatus })
    .eq("id", registration.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateEventPaths(eventId);

  return { success: true };
}
