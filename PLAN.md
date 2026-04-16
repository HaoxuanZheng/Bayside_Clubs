# BaysideClubs Full Plan

## 1. Product Vision
BaysideClubs is a student-facing web platform for Bayside High School that makes club discovery, event participation, and club management simple.

The platform should serve three main audiences:
- Students: discover clubs, join memberships, RSVP to events, and manage their profile.
- Club leaders/officers: publish events, share announcements, manage members, and run their club effectively.
- School administrators: approve clubs, moderate content, and monitor participation.

## 2. Current State Summary
The project is built with:
- Next.js 16 App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase Auth + PostgreSQL
- Supabase RLS-ready architecture

Existing assets include:
- public-facing home page and club/event listing routes
- auth pages: `/login`, `/register`, `/reset-password`
- admin routes: `/dashboard`, `/admin`, `/clubs/[slug]/admin`
- Supabase client middleware, server helpers, and typed database modules
- `supabase/migrations` folder for database schema

## 3. Product Scope
### Core MVP Features
- Public club discovery: list active clubs and browse club detail pages
- Event discovery: list published events and view event details
- Student auth: register, login, reset password, email verification
- Club membership: join/leave clubs and view joined clubs
- Event registration: RSVP to club events and see registrations
- Club leader tools: create/edit club events, publish announcements, and view member lists
- Admin tools: manage clubs, clubs approval, and user roles

### Essential Data Model
- `profiles` (auth users + student metadata)
- `clubs` (club metadata, category, status)
- `memberships` (student memberships in clubs)
- `events` (club events with publish status and capacity)
- `registrations` (event RSVPs)
- `announcements` (club news/posts)

### Roles
- `student`: default user role, can join clubs and RSVP events
- `officer`: club-level manager with event and announcement permissions
- `admin`: platform administrator with global moderation rights

## 4. Technical Architecture
### Frontend
- App Router for route-level layout and page organization
- Tailwind CSS for responsive UI and consistent brand style
- Server Components for page-level data fetching
- Client Components for interactive auth forms and buttons

### Backend / Data
- Supabase Auth for signup/login/password reset
- Supabase Postgres with RLS policies to enforce role-based access
- Supabase migrations for schema management
- Typed database models in `src/lib/types`

### Middleware & Security
- Root-level `middleware.ts` to protect authenticated routes
- Protected routes: `/dashboard`, `/admin`, `/profile`, `/clubs/*/admin`
- Public routes: `/`, `/clubs`, `/events`, `/login`, `/register`
- Strong input validation in UI and server actions

## 5. Implementation Roadmap
### Phase 1: Stabilize MVP
1. Audit current app pages and map required missing features.
2. Finalize and enforce database schema + Supabase RLS rules.
3. Implement or refine auth middleware and protected route logic.
4. Build core club/event listing and detail pages.
5. Complete user flows: register -> verify email -> login -> join club -> RSVP event.
6. Add profile/dashboard views showing joined clubs and registered events.

### Phase 2: Club & Admin Management
1. Complete club admin workflow:
   - create/edit club events
   - publish event announcements
   - manage club member roles
2. Complete platform admin workflow:
   - approve new clubs
   - manage user roles
   - moderate event content
3. Add analytics and reporting cards to admin dashboard.
4. Strengthen UX for mobile and accessibility.

### Phase 3: Polish & Launch
1. Add production-ready deployment configuration for Vercel.
2. Create `.env.example` and developer setup docs.
3. Add tests or manual QA checklists for auth, membership, and RLS.
4. Track metrics: club signups, event RSVPs, active users.
5. Launch with a pilot cohort and collect feedback.

## 6. Recommended Page Map
- `/` — landing / home page
- `/clubs` — public club listings
- `/clubs/[slug]` — club detail page
- `/clubs/[slug]/admin` — club leadership dashboard
- `/events` — public event listings
- `/events/[id]` — event details and RSVP
- `/register` — student signup
- `/login` — login page
- `/reset-password` — password request page
- `/dashboard` — student dashboard and quick access
- `/admin` — platform admin controls

## 7. Detailed Short-Term Task List
1. Review and finalize `supabase/migrations/001_initial_schema.sql`.
2. Confirm `src/lib/types/database.ts`, `src/lib/types/index.ts`, and `src/lib/types/supabase.ts` match schema.
3. Harden auth pages, especially login and registration validation.
4. Build or improve client-side membership and event registration actions.
5. Add missing `profile` and `dashboard` user-facing views.
6. Add club admin flows in `src/app/clubs/[slug]/admin/page.tsx`.
7. Add admin utilities in `src/app/admin/page.tsx`.
8. Deploy to Vercel and verify environment variable setup.

## 8. Success Criteria
- Users can sign up with a valid school email, verify, and log in.
- Authenticated users can join clubs and RSVP events.
- Club officers can publish events and announcements.
- Platform admins can moderate clubs and user roles.
- Access controls are enforced by Supabase RLS and middleware.
- UI is responsive and usable on mobile screens.

## 9. Future Extensions
- club discovery filters by category, grade, and meeting day
- event calendar view and reminders
- club chat or discussion boards
- club officer application workflow
- file uploads for club posters using Supabase Storage
- attendance tracking for events
- notification center for announcements and event reminders

## 10. Recommended Next Move
Start with a one-page audit:
- compare existing routes versus the target page map
- identify missing server actions and missing data fetches
- implement the core database model and auth middleware first

This plan is designed to take BaysideClubs from an MVP prototype to a polished student club platform with clear implementation steps, role definitions, and launch readiness.
