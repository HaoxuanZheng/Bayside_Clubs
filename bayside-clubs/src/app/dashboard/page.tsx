import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const supabase = await createServerSupabase();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p className="mb-4">Signed in as: {user?.email ?? "unknown"}</p>
      <SignOutButton />
    </main>
  );
}
