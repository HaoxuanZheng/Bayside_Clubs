# Bayside Hub Repository

Bayside Hub is a modern, responsive one-stop school website for Bayside High School.  
This repository contains the production app used by students, teachers, and staff.

## Repository layout

- `bayside-clubs/` — Next.js application source code
- `bayside-clubs/src/` — app routes, UI components, actions, and hooks
- `bayside-clubs/supabase/migrations/` — database schema and migration SQL

## Key capabilities

- One-stop homepage with a school-hub hero, live metrics, and quick access links
- Role-based sections for students, teachers, and staff
- Club and event management with announcements and registrations
- Admin dashboard and system administration tools
- Supabase authentication, role-aware access, and RLS-backed data security

## Quick start

1. `cd bayside-clubs`
2. `npm install`
3. Copy `.env.example` to `.env.local` and set your Supabase values
4. `npm run dev`
5. Open `http://localhost:3000`

For full app documentation, see `bayside-clubs/README.md`.
