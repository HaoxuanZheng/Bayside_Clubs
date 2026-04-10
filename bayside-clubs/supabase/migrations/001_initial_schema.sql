-- 001_initial_schema.sql
-- Initial database schema for BaysideClubs
-- Creates tables, RLS policies, indexes, and an auth.users trigger

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- Table: profiles
-- Extends auth.users: id references auth.users(id)
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  grade int,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_grade_check CHECK (grade IS NULL OR (grade >= 9 AND grade <= 12))
);

-- =====================
-- Table: clubs
-- =====================
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  category text CHECK (category IS NULL OR category IN ('Academic','Arts','Sports','Service','Tech','Other')),
  meeting_info text,
  contact_email text,
  cover_image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Table: memberships
-- =====================
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member','officer','admin')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, club_id)
);

-- =====================
-- Table: events
-- =====================
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  capacity int,
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Table: registrations
-- =====================
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

-- =====================
-- Table: announcements
-- =====================
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id uuid REFERENCES public.clubs(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =====================
-- Enable Row Level Security on all tables
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- =====================
-- Policies: profiles
-- - users (authenticated) can SELECT all profiles
-- - users can INSERT/UPDATE their own profile only
-- =====================
CREATE POLICY IF NOT EXISTS profiles_select_authenticated
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS profiles_insert_own
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY IF NOT EXISTS profiles_update_own
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================
-- Policies: clubs
-- - authenticated users may read active clubs
-- - global admin role may read/insert/update
-- - club admins (memberships.role='admin') can read their clubs
-- =====================
CREATE POLICY IF NOT EXISTS clubs_select_active
  ON public.clubs FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_active = true
      OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.clubs.id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS clubs_insert_admin
  ON public.clubs FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY IF NOT EXISTS clubs_update_admin
  ON public.clubs FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- =====================
-- Policies: memberships
-- - users read their own membership rows
-- - club admins read membership rows for their club
-- - users can insert their own membership
-- - club admins (or global admin) can delete memberships
-- =====================
CREATE POLICY IF NOT EXISTS memberships_select
  ON public.memberships FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.club_id = public.memberships.club_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY IF NOT EXISTS memberships_insert_user
  ON public.memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS memberships_delete_club_admin
  ON public.memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.club_id = public.memberships.club_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

-- =====================
-- Policies: events
-- - authenticated users read published events
-- - club admins (and global admins) can insert/update events for their club
-- =====================
CREATE POLICY IF NOT EXISTS events_select_published
  ON public.events FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_published = true
      OR EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.events.club_id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
  );

CREATE POLICY IF NOT EXISTS events_insert_club_admin
  ON public.events FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.events.club_id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY IF NOT EXISTS events_update_club_admin
  ON public.events FOR UPDATE
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.events.club_id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.events.club_id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
  );

-- =====================
-- Policies: registrations
-- - users read their own registrations
-- - event club admins read registrations for their events
-- - users insert/update their own registrations
-- =====================
CREATE POLICY IF NOT EXISTS registrations_select
  ON public.registrations FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.memberships m ON m.club_id = e.club_id
      WHERE e.id = public.registrations.event_id
        AND m.user_id = auth.uid()
        AND m.role = 'admin'
    )
    OR (
      SELECT role FROM public.profiles WHERE id = auth.uid()
    ) = 'admin'
  );

CREATE POLICY IF NOT EXISTS registrations_insert_user
  ON public.registrations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS registrations_update_own
  ON public.registrations FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =====================
-- Policies: announcements
-- - authenticated users may read
-- - club admins (and global admins) may insert for their club
-- =====================
CREATE POLICY IF NOT EXISTS announcements_select_authenticated
  ON public.announcements FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY IF NOT EXISTS announcements_insert_club_admin
  ON public.announcements FOR INSERT
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.club_id = public.announcements.club_id
          AND m.user_id = auth.uid()
          AND m.role = 'admin'
      )
      OR (
        SELECT role FROM public.profiles WHERE id = auth.uid()
      ) = 'admin'
    )
    AND created_by = auth.uid()
  );

-- =====================
-- Indexes
-- =====================
CREATE INDEX IF NOT EXISTS idx_memberships_club_id ON public.memberships (club_id);
CREATE INDEX IF NOT EXISTS idx_events_club_id ON public.events (club_id);
CREATE INDEX IF NOT EXISTS idx_events_starts_at ON public.events (starts_at);
CREATE INDEX IF NOT EXISTS idx_registrations_event_id ON public.registrations (event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON public.registrations (user_id);

-- =====================
-- Trigger: auto-create profile row after auth.users insert
-- The trigger function runs with SECURITY DEFINER so it can create the
-- corresponding profile even when RLS is enabled on profiles.
-- =====================
DROP TRIGGER IF EXISTS handle_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created();

CREATE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- create a basic profile record for the new auth user; do nothing if it exists
  INSERT INTO public.profiles (id, email, created_at)
  VALUES (NEW.id, NEW.email, now())
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER handle_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- End of migration
