# BaysideClubs
Full-stack student organization platform for Bayside High School.

[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?logo=vercel&logoColor=white)](https://vercel.com/)

**Live Demo:**  
- https://bayside-clubs.vercel.app  
- https://baysideclubs.dev (custom domain, if configured)

## Why this exists
Student clubs at school often rely on scattered flyers, chat messages, and word-of-mouth. BaysideClubs centralizes club discovery, event registration, and role-based management for students, club leaders, and system admins.

## Core features
- School-email authentication with Supabase Auth
- Club directory with category filtering, search, and membership actions
- Club detail pages with officers, announcements, and upcoming events
- Event discovery and registration with capacity handling
- Club admin dashboard for members, settings, and event management
- System admin panel for club creation, role management, and platform controls

## Screenshots
- [Screenshot: Homepage]
- [Screenshot: Club Directory]
- [Screenshot: Club Detail]
- [Screenshot: Event Detail]
- [Screenshot: Admin Dashboard]

## Local development

### Prerequisites
- Node.js 18+
- npm
- Supabase project

### Clone and install
```bash
git clone <your-repo-url>
cd bayside-clubs
npm install
```

### Environment variables
Copy `.env.example` to `.env.local` and fill in real values:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key for browser client |
| `SUPABASE_URL` | Yes | Supabase URL for server client |
| `SUPABASE_ANON_KEY` | Yes | Supabase anon key for server client |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Base URL for auth redirects (e.g. `http://localhost:3000`) |

### Supabase setup
1. Create a Supabase project.
2. Run migrations in order from `supabase/migrations/`:
   - `001_initial_schema.sql`
   - `002_event_registration_functions.sql`
   - `003_admin_management_policies.sql`
3. Confirm RLS policies and trigger creation succeeded.

### Start the app
```bash
npm run dev
```
Open http://localhost:3000.

## Database schema overview
The schema uses:
- `profiles` (extends `auth.users`)
- `clubs`
- `memberships` (many-to-many user/club with role)
- `events`
- `registrations`
- `announcements`

Design highlights:
- Role-aware access with Supabase RLS
- Membership junction table for per-club roles (`member`, `officer`, `admin`)
- Transaction-safe event registration function for capacity protection

## Deployment (Vercel)

### Vercel checklist
1. Import the GitHub repository into Vercel.
2. Set all environment variables from the table above in the Vercel dashboard.
3. Ensure production build succeeds (`npm run build`).
4. Deploy and verify auth flows on the production URL.

### Supabase production checklist
1. In Supabase Auth settings, add:
   - `https://bayside-clubs.vercel.app`
   - `https://baysideclubs.dev` (if used)
2. Add callback/redirect URLs used by login, signup, and password reset flows.
3. Confirm CORS allows your production domain.
4. Re-run migrations on production Supabase if needed.

### Build issues to watch for
- Missing env vars in Vercel (most common)
- RLS policy mismatches causing empty query results
- Wrong redirect URLs in Supabase Auth configuration

## About the developer
Built by **Haoxuan Zheng**, Grade 11, Bayside High School.  
CTE: Computer Programming & Web Design.  
Also built: **Sanus Space** (AI health app, App Store + Google Play).
