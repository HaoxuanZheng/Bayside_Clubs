import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";

const roleCards = [
  {
    role: "Students",
    description: "Track events, join clubs, and stay connected to everything happening on campus.",
    highlights: ["Discover clubs", "View upcoming events", "Manage activities"],
  },
  {
    role: "Teachers",
    description: "Coordinate activities, share important updates, and support student leadership.",
    highlights: ["Post club events", "Share announcements", "Guide student teams"],
  },
  {
    role: "Staff",
    description: "Keep school operations centralized with quick access to admin and communication tools.",
    highlights: ["Oversee programs", "Monitor participation", "Keep information organized"],
  },
];

const quickLinks = [
  {
    title: "Clubs Directory",
    description: "Explore school organizations by category and interest.",
    href: "/clubs",
    action: "Open clubs",
  },
  {
    title: "School Events",
    description: "See upcoming meetings, activities, and school-wide events.",
    href: "/events",
    action: "Open events",
  },
  {
    title: "Leadership Dashboard",
    description: "Manage club operations, events, and member workflows.",
    href: "/dashboard",
    action: "Open dashboard",
  },
  {
    title: "System Admin",
    description: "Access school-level controls and platform administration.",
    href: "/admin",
    action: "Open admin panel",
  },
  {
    title: "Account Login",
    description: "Sign in quickly to get role-based access across the platform.",
    href: "/login",
    action: "Go to login",
  },
  {
    title: "New User Registration",
    description: "Create an account with your school email and get started.",
    href: "/register",
    action: "Go to registration",
  },
];

const essentials = [
  {
    title: "Academic & Activity Calendar",
    description: "Keep classes, clubs, and campus events synced in one shared timeline.",
  },
  {
    title: "Announcements & Updates",
    description: "Publish important reminders and reach students, teachers, and staff quickly.",
  },
  {
    title: "Policies & Resources",
    description: "Centralize forms, guides, and key school policies in one easy-to-find place.",
  },
  {
    title: "Support & Communication",
    description: "Reduce confusion with a single hub for information and next actions.",
  },
];

export default async function Home() {
  const supabase = await createServerSupabase();

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nextMonthStart = new Date(monthStart);
  nextMonthStart.setMonth(nextMonthStart.getMonth() + 1);

  const [clubsCountResult, studentsCountResult, staffCountResult, eventsCountResult] =
    await Promise.all([
      supabase
        .from("clubs")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("role", "student"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("role", "admin"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .gte("starts_at", monthStart.toISOString())
        .lt("starts_at", nextMonthStart.toISOString()),
    ]);

  const clubsCount = clubsCountResult.count ?? 0;
  const studentsCount = studentsCountResult.count ?? 0;
  const staffCount = staffCountResult.count ?? 0;
  const eventsThisMonthCount = eventsCountResult.count ?? 0;
  const metrics = [
    { label: "Active Clubs", value: clubsCount },
    { label: "Students", value: studentsCount },
    { label: "Staff & Admin", value: staffCount },
    { label: "Events This Month", value: eventsThisMonthCount },
  ];

  return (
    <div className="bg-slate-50">
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1E3A5F]">
            Bayside School Hub
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            One place for students, teachers, and staff
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            A single school website for daily updates, clubs, events, and role-specific tools.
            Keep your entire campus informed and connected from one dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/events"
              className="inline-flex items-center rounded-md bg-[#1E3A5F] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#17304D]"
            >
              View School Events
            </Link>
            <Link
              href="/clubs"
              className="inline-flex items-center rounded-md border border-[#1E3A5F] bg-white px-5 py-2.5 text-sm font-semibold text-[#1E3A5F] shadow-sm transition hover:bg-[#EEF3F8]"
            >
              Explore Clubs
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-900">{metric.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                  {metric.label}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Built for every role on campus
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {roleCards.map((card) => (
              <article key={card.role} className="rounded-xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">{card.role}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {card.highlights.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1 h-2 w-2 rounded-full bg-[#1E3A5F]" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quick access</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-[#1E3A5F] hover:shadow-sm"
              >
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                <p className="mt-4 text-sm font-semibold text-[#1E3A5F]">{item.action} →</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {essentials.map((item) => (
            <article
              key={item.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
