"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { MembershipRole } from "@/lib/types";

type ActionResult = {
  success: boolean;
  error?: string;
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

async function getClubSlugById(clubId: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", clubId)
    .maybeSingle();

  if (error || !data?.slug) {
    return null;
  }

  return data.slug;
}

function revalidateClubPaths(slug: string | null): void {
  revalidatePath("/clubs");
  revalidatePath("/clubs/[slug]", "page");

  if (slug) {
    revalidatePath(`/clubs/${slug}`);
  }
}

export async function getMembershipStatus(clubId: string): Promise<MembershipRole | null> {
  if (!clubId) {
    return null;
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return null;
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.role;
}

export async function joinClub(clubId: string): Promise<ActionResult> {
  if (!clubId) {
    return { success: false, error: "Invalid club id" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabase();

  const { data: existingMembership, error: membershipLookupError } = await supabase
    .from("memberships")
    .select("id")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (membershipLookupError) {
    return { success: false, error: membershipLookupError.message };
  }

  if (existingMembership) {
    return { success: false, error: "Already a member" };
  }

  const { error: insertError } = await supabase.from("memberships").insert({
    user_id: userId,
    club_id: clubId,
    role: "member",
  });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  const slug = await getClubSlugById(clubId);
  revalidateClubPaths(slug);

  return { success: true };
}

export async function leaveClub(clubId: string): Promise<ActionResult> {
  if (!clubId) {
    return { success: false, error: "Invalid club id" };
  }

  const userId = await getCurrentUserId();
  if (!userId) {
    return { success: false, error: "Not authenticated" };
  }

  const supabase = await createServerSupabase();

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("id, role")
    .eq("user_id", userId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (membershipError) {
    return { success: false, error: membershipError.message };
  }

  if (!membership) {
    return { success: false, error: "Not a member" };
  }

  if (membership.role === "admin") {
    const { count: adminCount, error: adminCountError } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("club_id", clubId)
      .eq("role", "admin");

    if (adminCountError) {
      return { success: false, error: adminCountError.message };
    }

    if ((adminCount ?? 0) <= 1) {
      return { success: false, error: "You are the only admin for this club" };
    }
  }

  const { error: deleteError } = await supabase
    .from("memberships")
    .delete()
    .eq("user_id", userId)
    .eq("club_id", clubId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  const slug = await getClubSlugById(clubId);
  revalidateClubPaths(slug);

  return { success: true };
}
