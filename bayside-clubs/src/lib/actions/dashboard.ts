"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ClubCategory } from "@/lib/types";

type ActionResult = {
  success: boolean;
  error?: string;
};

type UpdateClubInput = {
  description?: string | null;
  meeting_info?: string | null;
  contact_email?: string | null;
  category?: ClubCategory | null;
};

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

async function getCurrentUserRole(): Promise<string | null> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  return data.role;
}

async function getClubSlugById(clubId: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("clubs").select("slug").eq("id", clubId).maybeSingle();

  if (error || !data?.slug) {
    return null;
  }

  return data.slug;
}

async function canManageClub(clubId: string): Promise<boolean> {
  const userId = await getCurrentUserId();
  if (!userId) {
    return false;
  }

  const userRole = await getCurrentUserRole();
  if (userRole === "admin") {
    return true;
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.role === "admin";
}

function revalidateClubPaths(clubId: string, slug: string | null): void {
  revalidatePath("/dashboard");
  revalidatePath("/clubs");
  revalidatePath("/clubs/[slug]", "page");
  if (slug) {
    revalidatePath(`/clubs/${slug}`);
  }
  revalidatePath(`/dashboard?club=${clubId}`);
}

function revalidateDashboardPaths(): void {
  revalidatePath("/dashboard");
}

export async function removeClubMember(memberId: string, clubId: string): Promise<ActionResult> {
  if (!memberId || !clubId) {
    return { success: false, error: "Invalid member or club id" };
  }

  if (!(await canManageClub(clubId))) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createServerSupabase();
  const { data: targetMembership, error: targetError } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("id", memberId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (targetError) {
    return { success: false, error: targetError.message };
  }

  if (!targetMembership) {
    return { success: false, error: "Member not found" };
  }

  const currentUserRole = await getCurrentUserRole();
  const isGlobalAdmin = currentUserRole === "admin";

  if (targetMembership.role === "admin" && !isGlobalAdmin) {
    const { count: adminCount, error: adminCountError } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("role", "admin");

    if (adminCountError) {
      return { success: false, error: adminCountError.message };
    }

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: "You cannot remove the last admin" };
    }
  }

  const { error: deleteError } = await supabase.from("memberships").delete().eq("id", memberId).eq("club_id", clubId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const slug = await getClubSlugById(clubId);
  revalidateClubPaths(clubId, slug);

  return { success: true };
}

export async function promoteClubMember(memberId: string, clubId: string): Promise<ActionResult> {
  if (!memberId || !clubId) {
    return { success: false, error: "Invalid member or club id" };
  }

  if (!(await canManageClub(clubId))) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createServerSupabase();
  const { data: targetMembership, error: targetError } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("id", memberId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (targetError) {
    return { success: false, error: targetError.message };
  }

  if (!targetMembership) {
    return { success: false, error: "Member not found" };
  }

  if (targetMembership.role === "officer") {
    return { success: true };
  }

  const { error } = await supabase.from("memberships").update({ role: "officer" }).eq("id", memberId).eq("club_id", clubId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateDashboardPaths();
  return { success: true };
}

export async function updateClub(clubId: string, data: UpdateClubInput): Promise<ActionResult> {
  if (!clubId) {
    return { success: false, error: "Invalid club id" };
  }

  if (!(await canManageClub(clubId))) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createServerSupabase();

  const payload = {
    description: data.description?.trim() ? data.description.trim() : null,
    meeting_info: data.meeting_info?.trim() ? data.meeting_info.trim() : null,
    contact_email: data.contact_email?.trim() ? data.contact_email.trim() : null,
    category: data.category ?? null,
  };

  const { error } = await supabase.from("clubs").update(payload).eq("id", clubId);

  if (error) {
    return { success: false, error: error.message };
  }

  const slug = await getClubSlugById(clubId);
  revalidateClubPaths(clubId, slug);

  return { success: true };
}

export async function deleteClubEvent(eventId: string, clubId: string): Promise<ActionResult> {
  if (!eventId || !clubId) {
    return { success: false, error: "Invalid event or club id" };
  }

  if (!(await canManageClub(clubId))) {
    return { success: false, error: "Not authorized" };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("events").delete().eq("id", eventId).eq("club_id", clubId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateDashboardPaths();
  revalidatePath("/events");
  revalidatePath("/events/[id]", "page");
  return { success: true };
}
