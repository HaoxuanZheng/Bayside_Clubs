"use client";

import { AdminRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { profile, user } = useAuth();

  return (
    <AdminRoute>
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold text-zinc-900">Admin Panel</h1>
        <p className="mt-2 text-zinc-600">Restricted to platform administrators.</p>

        <section className="mt-6 rounded-lg border border-zinc-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-zinc-900">Current Session</h2>
          <p className="mt-2 text-sm text-zinc-700">User: {profile?.display_name || user?.email || "Unknown"}</p>
          <p className="mt-1 text-sm text-zinc-700">Role: {profile?.role || "unknown"}</p>
        </section>
      </main>
    </AdminRoute>
  );
}
