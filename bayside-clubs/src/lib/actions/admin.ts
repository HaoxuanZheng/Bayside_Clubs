"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import type { ClubCategory } from "@/lib/types";

type ActionResult = {
  success: boolean;
  error?: string;
};

type CreateClubInput = {
  name: string;
  slug: string;
  description?: string | null;
  category?: ClubCategory | null;
  meeting_info?: string | null;
  contact_email?: string | null;
};

type CreateClubResult = ActionResult & {
  clubId?: string;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabase>>;

type AdminContext =
  | {
      supabase: SupabaseServerClient;
      userId: string;
    }
  | {
      supabase: SupabaseServerClient;
      userId: null;
      error: string;
    };

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function revalidateAdminPaths(): void {
  revalidatePath("/admin");
  revalidatePath("/clubs");
  revalidatePath("/dashboard");
}

async function requireAdminContext(): Promise<AdminContext> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { supabase, userId: null, error: "Not authenticated" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { supabase, userId: null, error: profileError.message };
  }

  if (profile?.role !== "admin") {
    return { supabase, userId: null, error: "Not authorized" };
  }

  return { supabase, userId: user.id };
}

export async function createClub(data: CreateClubInput): Promise<CreateClubResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  const name = data.name?.trim() ?? "";
  const slug = normalizeSlug(data.slug || data.name);

  if (name.length < 2) {
    return { success: false, error: "Club name must be at least 2 characters" };
  }

  if (!slug) {
    return { success: false, error: "Club slug is required" };
  }

  const payload = {
    name,
    slug,
    description: normalizeOptionalText(data.description),
    category: data.category ?? null,
    meeting_info: normalizeOptionalText(data.meeting_info),
    contact_email: normalizeOptionalText(data.contact_email),
  };

  const { data: createdClub, error } = await adminContext.supabase
    .from("clubs")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true, clubId: createdClub.id };
}

export async function makeClubAdminByEmail(
  email: string,
  clubId: string,
): Promise<ActionResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !clubId) {
    return { success: false, error: "Email and club are required" };
  }

  const { data: profile, error: profileError } = await adminContext.supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", normalizedEmail)
    .maybeSingle();

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  if (!profile) {
    return { success: false, error: "No user found with that email" };
  }

  const { error } = await adminContext.supabase.from("memberships").upsert(
    {
      user_id: profile.id,
      club_id: clubId,
      role: "admin",
    },
    { onConflict: "user_id,club_id" },
  );

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function removeClubAdmin(membershipId: string): Promise<ActionResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  if (!membershipId) {
    return { success: false, error: "Invalid membership id" };
  }

  const { data: membership, error: membershipError } = await adminContext.supabase
    .from("memberships")
    .select("id, club_id, role")
    .eq("id", membershipId)
    .maybeSingle();

  if (membershipError) {
    return { success: false, error: membershipError.message };
  }

  if (!membership) {
    return { success: false, error: "Membership not found" };
  }

  if (membership.role !== "admin") {
    return { success: false, error: "Selected membership is not an admin" };
  }

  const { count: adminCount, error: adminCountError } = await adminContext.supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("club_id", membership.club_id)
    .eq("role", "admin");

  if (adminCountError) {
    return { success: false, error: adminCountError.message };
  }

  if ((adminCount ?? 0) <= 1) {
    return { success: false, error: "Cannot remove the last admin from a club" };
  }

  const { error } = await adminContext.supabase
    .from("memberships")
    .delete()
    .eq("id", membershipId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function makeSystemAdmin(userId: string): Promise<ActionResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  if (!userId) {
    return { success: false, error: "Invalid user id" };
  }

  const { error } = await adminContext.supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function deactivateUser(userId: string): Promise<ActionResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  if (!userId) {
    return { success: false, error: "Invalid user id" };
  }

  if (userId === adminContext.userId) {
    return { success: false, error: "You cannot deactivate your own account" };
  }

  const { error } = await adminContext.supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}

export async function toggleClubActive(
  clubId: string,
  isActive: boolean,
): Promise<ActionResult> {
  const adminContext = await requireAdminContext();
  if (adminContext.userId === null) {
    return { success: false, error: adminContext.error };
  }

  if (!clubId) {
    return { success: false, error: "Invalid club id" };
  }

  const { error } = await adminContext.supabase
    .from("clubs")
    .update({ is_active: isActive })
    .eq("id", clubId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidateAdminPaths();
  return { success: true };
}
