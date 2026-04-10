# Bayside_Clubs

Bayside_Clubs is a small web application for managing student clubs, events, and memberships at Bayside High School. It provides students, club leaders, and administrators with tools to discover clubs, register for events, manage memberships, and share announcements.

## Key features

- Club discovery and membership registration
- User authentication and profiles (Supabase)
- Student dashboard and admin management views
- Event creation, RSVP, and announcements
- Responsive UI built with Next.js and TypeScript

## Quick start

1. Install dependencies:

	npm install

2. Create a `.env.local` and add your Supabase keys (example variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).

3. Run the development server:

	npm run dev

4. Open http://localhost:3000 in your browser.

## Project structure

- `src/app/` — Next.js app routes and pages
- `src/components/` — Reusable UI components
- `src/lib/supabase/` — Supabase client, middleware, and server helpers
- `supabase/migrations/` — Database schema and migrations

## Contributing

Contributions are welcome. Please open an issue to discuss major changes, and submit pull requests for smaller fixes or features. Follow the project's linting and formatting rules.

## License

Specify a license for the project (e.g., MIT).
