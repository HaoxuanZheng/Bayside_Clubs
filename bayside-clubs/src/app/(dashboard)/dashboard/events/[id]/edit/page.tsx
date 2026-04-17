import { notFound, redirect } from "next/navigation";
import EventForm from "@/components/dashboard/EventForm";
import { createServerSupabase } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }>;
};

type EventRow = {
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

type ClubOption = {
  id: string;
  name: string;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
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

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, club_id, title, description, location, starts_at, ends_at, capacity, is_published")
    .eq("id", id)
    .maybeSingle();

  if (eventError) {
    throw new Error(eventError.message);
  }

  if (!event) {
    notFound();
  }

  if (!isSystemAdmin) {
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", event.club_id)
      .eq("role", "admin")
      .maybeSingle();

    if (membershipError) {
      throw new Error(membershipError.message);
    }

    if (!membership) {
      redirect("/dashboard");
    }
  }

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

  const eventRow = event as EventRow;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <EventForm
        mode="edit"
        clubOptions={clubs}
        initialData={{
          id: eventRow.id,
          club_id: eventRow.club_id,
          title: eventRow.title,
          description: eventRow.description,
          location: eventRow.location,
          starts_at: eventRow.starts_at,
          ends_at: eventRow.ends_at,
          capacity: eventRow.capacity,
          is_published: eventRow.is_published,
        }}
      />
    </main>
  );
}

