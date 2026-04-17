import { redirect } from "next/navigation";
import EventForm from "@/components/dashboard/EventForm";
import { createServerSupabase } from "@/lib/supabase/server";

type ClubOption = {
  id: string;
  name: string;
};

export default async function NewEventPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const isSystemAdmin = profile?.role === "admin";

  let clubs: ClubOption[] = [];

  if (isSystemAdmin) {
    const { data: allClubs, error } = await supabase
      .from("clubs")
      .select("id, name")
      .order("name", { ascending: true });
    if (error) {
      throw new Error(error.message);
    }
    clubs = allClubs ?? [];
  } else {
    const { data: memberships, error: membershipsError } = await supabase
      .from("memberships")
      .select("club_id")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (membershipsError) {
      throw new Error(membershipsError.message);
    }

    const clubIds = (memberships ?? []).map((membership) => membership.club_id);
    if (clubIds.length === 0) {
      redirect("/dashboard");
    }

    const { data: adminClubs, error: clubsError } = await supabase
      .from("clubs")
      .select("id, name")
      .in("id", clubIds)
      .order("name", { ascending: true });

    if (clubsError) {
      throw new Error(clubsError.message);
    }

    clubs = adminClubs ?? [];
  }

  if (clubs.length === 0) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <EventForm mode="create" clubOptions={clubs} />
    </main>
  );
}

