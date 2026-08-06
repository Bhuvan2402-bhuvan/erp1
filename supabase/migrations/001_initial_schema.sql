-- ============================================================================
-- VVITU NSS ERP — Supabase PostgreSQL Initial Schema
-- Migration: 001_initial_schema.sql
--
-- Run via: Supabase Dashboard → SQL Editor → New Query → Paste & Run
--          OR: supabase db push (if using Supabase CLI)
--
-- Tables:
--   profiles       — Extended user info synced from auth.users
--   events         — NSS events created by leads/admins
--   event_photos   — R2-hosted photos associated with events
--
-- Security:
--   Row Level Security (RLS) is enabled on all tables.
--   Policies enforce role-based access using the `role` column on `profiles`.
-- ============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── profiles ────────────────────────────────────────────────────────────────
-- One row per auth.users entry; created automatically via trigger (see below).

CREATE TABLE IF NOT EXISTS public.profiles (
  id             UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT         UNIQUE NOT NULL,
  role           TEXT         NOT NULL DEFAULT 'volunteer'
                              CHECK (role IN ('volunteer', 'event_lead', 'faculty', 'admin')),
  roll_number    TEXT,
  department     TEXT,
  phone          TEXT,
  hours_logged   NUMERIC(8,2) NOT NULL DEFAULT 0,
  avatar_url     TEXT,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles IS 'Extended profile data for each authenticated Supabase user.';
COMMENT ON COLUMN public.profiles.role IS 'volunteer | event_lead | faculty | admin';

-- ─── events ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.events (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT         NOT NULL,
  description  TEXT,
  event_date   DATE         NOT NULL,
  location     TEXT,
  max_capacity INTEGER,
  created_by   UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.events IS 'NSS events — only event_leads and admins may create/edit.';

-- ─── event_photos ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_photos (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id     UUID         NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  photo_url    TEXT         NOT NULL,           -- Cloudflare R2 public CDN URL
  r2_key       TEXT,                            -- R2 object key (for deletion)
  caption      TEXT,
  uploaded_by  UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.event_photos IS 'Photos for each event, stored in Cloudflare R2.';
COMMENT ON COLUMN public.event_photos.photo_url IS 'Full public CDN URL returned by the presigned-URL upload flow.';
COMMENT ON COLUMN public.event_photos.r2_key    IS 'R2 object key — used by the backend to delete the file from R2.';

-- ─── updated_at trigger ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Auto-create profile on sign-up ──────────────────────────────────────────
-- Supabase fires this trigger whenever a new user completes sign-up in auth.users.
-- It creates the corresponding profiles row so the app always has a profile record.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;   -- Idempotent — safe to run multiple times
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_events_created_by  ON public.events(created_by);
CREATE INDEX IF NOT EXISTS idx_events_event_date   ON public.events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_event_photos_event  ON public.event_photos(event_id);
CREATE INDEX IF NOT EXISTS idx_event_photos_uploader ON public.event_photos(uploaded_by);

-- ─── Enable Row Level Security ────────────────────────────────────────────────

ALTER TABLE public.profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_photos ENABLE ROW LEVEL SECURITY;

-- ─── RLS: profiles ───────────────────────────────────────────────────────────

-- Any authenticated user can view all profiles (for directory / chat)
CREATE POLICY "profiles: authenticated users can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only update their own profile
CREATE POLICY "profiles: users update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING      (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Only admins can delete profiles (account deactivation)
CREATE POLICY "profiles: admins can delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── RLS: events ─────────────────────────────────────────────────────────────

-- All authenticated users can read published events
CREATE POLICY "events: authenticated users can read published"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins and event leads can also read unpublished (draft) events
CREATE POLICY "events: leads and admins can read all"
  ON public.events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('event_lead', 'admin')
    )
  );

-- Only event_leads and admins can create events
CREATE POLICY "events: leads and admins can insert"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('event_lead', 'admin')
    )
  );

-- Creators and admins can update their events
CREATE POLICY "events: creator or admin can update"
  ON public.events FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Only admins can delete events
CREATE POLICY "events: admins can delete"
  ON public.events FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── RLS: event_photos ────────────────────────────────────────────────────────

-- All authenticated users can view photos of published events
CREATE POLICY "event_photos: authenticated users can read"
  ON public.event_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.is_published = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('event_lead', 'admin')
    )
  );

-- Any authenticated user (who can view the event) can upload photos
CREATE POLICY "event_photos: authenticated users can insert"
  ON public.event_photos FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Only the uploader or an admin can delete their photos
CREATE POLICY "event_photos: uploader or admin can delete"
  ON public.event_photos FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ─── Grant permissions ────────────────────────────────────────────────────────

GRANT USAGE  ON SCHEMA public           TO authenticated, anon;
GRANT SELECT ON public.profiles         TO authenticated;
GRANT SELECT ON public.events           TO authenticated;
GRANT SELECT ON public.event_photos     TO authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT INSERT, DELETE ON public.event_photos   TO authenticated;

-- ─── Done ─────────────────────────────────────────────────────────────────────
-- To verify: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
