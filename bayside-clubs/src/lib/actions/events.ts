"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";

type ActionResult = {
  success: boolean;
  error?: string;
};

type RegistrationStatus = "confirmed" | "cancelled";

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user.id;
}

function revalidateEventPaths(eventId: string): void {
  revalidatePath("/events");
  revalidatePath("/events/[id]", "page");
  revalidatePath(`/events/${eventId}`);
}

export async function registerForEvent(eventId: string): Promise<ActionResult> {
  if (!eventId) {
    return { success: false, error: "Invalid event id" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabase();

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
    .eq("user_id", userId)
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

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabase();

  const { data: registration, error: registrationError } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
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
