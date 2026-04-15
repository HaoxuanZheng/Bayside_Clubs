import Link from "next/link";

const links = [
  { href: "/clubs", label: "Clubs", description: "Browse active clubs and join a community." },
  { href: "/events", label: "Events", description: "See upcoming published events." },
  { href: "/login", label: "Login", description: "Sign in to manage memberships and register." },
  { href: "/register", label: "Register", description: "Create a new student account." },
  { href: "/dashboard", label: "Dashboard", description: "Open the club admin dashboard." },
  { href: "/admin", label: "Admin", description: "Go to the platform admin panel." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(9,9,11,0.08),_transparent_40%),linear-gradient(180deg,_#fafafa_0%,_#ffffff_100%)] px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 rounded-3xl border border-zinc-200 bg-white/90 p-8 shadow-sm backdrop-blur sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">BaysideClubs</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Navigate BaysideClubs from one simple home page.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            Jump straight to clubs, events, sign-in, registration, or the admin tools you were testing.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-zinc-200 bg-zinc-50 p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-zinc-900">{link.label}</h2>
                <span className="text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-900">→</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
