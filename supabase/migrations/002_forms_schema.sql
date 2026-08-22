-- ============================================================================
-- VVITU NSS ERP — Forms Module Schema & RLS
-- Migration: 002_forms_schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Enums (PostgreSQL) ───────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE form_status AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE form_visibility AS ENUM ('DEPARTMENT_ONLY', 'SELECTED_DEPARTMENTS', 'ALL_VOLUNTEERS', 'SELECTED_USERS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE response_status AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── forms ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.forms (
  id                        UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id             TEXT         NOT NULL,
  created_by_id             TEXT         NOT NULL,
  title                     TEXT         NOT NULL,
  description               TEXT,
  category                  TEXT         DEFAULT 'General',
  cover_image_url           TEXT,
  instructions              TEXT,
  status                    TEXT         NOT NULL DEFAULT 'DRAFT'
                                         CHECK (status IN ('DRAFT','PUBLISHED','CLOSED','ARCHIVED')),
  visibility                TEXT         NOT NULL DEFAULT 'DEPARTMENT_ONLY'
                                         CHECK (visibility IN ('DEPARTMENT_ONLY','SELECTED_DEPARTMENTS','ALL_VOLUNTEERS','SELECTED_USERS')),
  starts_at                 TIMESTAMPTZ,
  ends_at                   TIMESTAMPTZ,
  allow_multiple_submissions BOOLEAN     NOT NULL DEFAULT false,
  allow_editing             BOOLEAN      NOT NULL DEFAULT false,
  allow_draft               BOOLEAN      NOT NULL DEFAULT true,
  anonymous                 BOOLEAN      NOT NULL DEFAULT false,
  max_responses             INTEGER,
  require_auth              BOOLEAN      NOT NULL DEFAULT true,
  confirmation_message      TEXT         DEFAULT 'Thank you for your submission!',
  notify_on_submission      BOOLEAN      NOT NULL DEFAULT true,
  notify_on_review          BOOLEAN      NOT NULL DEFAULT true,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forms_department_id ON public.forms(department_id);
CREATE INDEX IF NOT EXISTS idx_forms_status        ON public.forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_created_by_id ON public.forms(created_by_id);
CREATE INDEX IF NOT EXISTS idx_forms_visibility    ON public.forms(visibility);

-- ─── form_fields ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_fields (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id          UUID        NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  field_type       TEXT        NOT NULL,
  label            TEXT        NOT NULL,
  description      TEXT,
  placeholder      TEXT,
  required         BOOLEAN     NOT NULL DEFAULT false,
  default_value    TEXT,
  help_text        TEXT,
  options          JSONB,
  validation_rules JSONB,
  conditional_rules JSONB,
  sort_order       INTEGER     NOT NULL DEFAULT 0,
  is_deleted       BOOLEAN     NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id ON public.form_fields(form_id, sort_order);

-- ─── form_responses ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_responses (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id         UUID        NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_by_id TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'DRAFT'
                              CHECK (status IN ('DRAFT','SUBMITTED','UNDER_REVIEW','APPROVED','REJECTED')),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_form_responses_unique
  ON public.form_responses(form_id, submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id       ON public.form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_by  ON public.form_responses(submitted_by_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_status        ON public.form_responses(status);

-- ─── form_answers ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_answers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID        NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  field_id    UUID        NOT NULL REFERENCES public.form_fields(id),
  value       TEXT,
  values      JSONB,
  file_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_form_answers_unique ON public.form_answers(response_id, field_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_response_id ON public.form_answers(response_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_field_id    ON public.form_answers(field_id);

-- ─── form_access ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_access (
  id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id       UUID  NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  department_id TEXT,
  user_id       TEXT,
  access_type   TEXT  NOT NULL DEFAULT 'view'
);

CREATE INDEX IF NOT EXISTS idx_form_access_form_id       ON public.form_access(form_id);
CREATE INDEX IF NOT EXISTS idx_form_access_department_id ON public.form_access(department_id);
CREATE INDEX IF NOT EXISTS idx_form_access_user_id       ON public.form_access(user_id);

-- ─── form_response_notes ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_response_notes (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID        NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  author_id   TEXT        NOT NULL,
  note        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_response_notes_response_id ON public.form_response_notes(response_id);

-- ─── form_audit_logs ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.form_audit_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id    UUID        NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL,
  action     TEXT        NOT NULL,
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_audit_logs_form_id ON public.form_audit_logs(form_id);
CREATE INDEX IF NOT EXISTS idx_form_audit_logs_user_id ON public.form_audit_logs(user_id);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_forms_updated_at BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_form_fields_updated_at BEFORE UPDATE ON public.form_fields FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_form_responses_updated_at BEFORE UPDATE ON public.form_responses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER trg_form_answers_updated_at BEFORE UPDATE ON public.form_answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Enable RLS ───────────────────────────────────────────────────────────────

ALTER TABLE public.forms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_answers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_access         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_response_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_audit_logs     ENABLE ROW LEVEL SECURITY;

-- ─── Helper: get caller's user record from users table ────────────────────────
-- NOTE: These RLS policies work with the Prisma `users` table (not auth.users directly).
-- The users table stores the app-level user with role and departmentId.

-- ─── RLS: forms ───────────────────────────────────────────────────────────────

-- ADMIN: full access
CREATE POLICY "forms: admin full access"
  ON public.forms FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text AND u.role = 'ADMIN')
  );

-- FACULTY/STUDENT_COORDINATOR: read forms in their department
CREATE POLICY "forms: faculty and coordinator read own dept"
  ON public.forms FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = forms.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = forms.department_id)
        )
    )
  );

-- FACULTY: can create forms for their department
CREATE POLICY "forms: faculty create in own dept"
  ON public.forms FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = forms.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = forms.department_id)
          OR u.role = 'ADMIN'
        )
    )
  );

-- FACULTY: can update forms in their department
CREATE POLICY "forms: faculty update own dept"
  ON public.forms FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = forms.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = forms.department_id)
          OR u.role = 'ADMIN'
        )
    )
  );

-- STUDENT: can view published forms they have access to
CREATE POLICY "forms: student view eligible"
  ON public.forms FOR SELECT TO authenticated
  USING (
    status = 'PUBLISHED'
    AND (
      visibility = 'ALL_VOLUNTEERS'
      OR (
        visibility = 'DEPARTMENT_ONLY'
        AND EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.students s ON s."userId" = u.id
          WHERE u."supabaseUid" = auth.uid()::text
            AND s."departmentId" = forms.department_id
        )
      )
      OR (
        visibility = 'SELECTED_DEPARTMENTS'
        AND EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.students s ON s."userId" = u.id
          JOIN public.form_access fa ON fa.form_id = forms.id AND fa.department_id = s."departmentId"
          WHERE u."supabaseUid" = auth.uid()::text
        )
      )
      OR (
        visibility = 'SELECTED_USERS'
        AND EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.form_access fa ON fa.form_id = forms.id AND fa.user_id = u.id
          WHERE u."supabaseUid" = auth.uid()::text
        )
      )
    )
  );

-- ─── RLS: form_responses ──────────────────────────────────────────────────────

-- ADMIN: full access
CREATE POLICY "form_responses: admin full access"
  ON public.form_responses FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text AND u.role = 'ADMIN')
  );

-- STUDENT: can read/write only their own responses
CREATE POLICY "form_responses: student own responses"
  ON public.form_responses FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u."supabaseUid" = auth.uid()::text AND u.id = form_responses.submitted_by_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u."supabaseUid" = auth.uid()::text AND u.id = form_responses.submitted_by_id
    )
  );

-- FACULTY/COORDINATOR: can read responses for forms in their department
CREATE POLICY "form_responses: faculty read own dept"
  ON public.form_responses FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      JOIN public.forms frm ON frm.id = form_responses.form_id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = frm.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = frm.department_id)
        )
    )
  );

-- FACULTY/COORDINATOR: can update response status (review)
CREATE POLICY "form_responses: faculty update status own dept"
  ON public.form_responses FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      JOIN public.forms frm ON frm.id = form_responses.form_id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = frm.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = frm.department_id)
        )
    )
  );

-- ─── RLS: form_answers ───────────────────────────────────────────────────────

-- ADMIN: full access
CREATE POLICY "form_answers: admin full access"
  ON public.form_answers FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text AND u.role = 'ADMIN')
  );

-- STUDENT: can only see/write their own answers
CREATE POLICY "form_answers: student own answers"
  ON public.form_answers FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.form_responses fr ON fr.id = form_answers.response_id
      WHERE u."supabaseUid" = auth.uid()::text AND u.id = fr.submitted_by_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.form_responses fr ON fr.id = form_answers.response_id
      WHERE u."supabaseUid" = auth.uid()::text AND u.id = fr.submitted_by_id
    )
  );

-- FACULTY: can read answers for responses in their dept
CREATE POLICY "form_answers: faculty read own dept"
  ON public.form_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      LEFT JOIN public.faculty f ON f."userId" = u.id
      LEFT JOIN public.students s ON s."userId" = u.id
      JOIN public.form_responses fr ON fr.id = form_answers.response_id
      JOIN public.forms frm ON frm.id = fr.form_id
      WHERE u."supabaseUid" = auth.uid()::text
        AND (
          (u.role = 'FACULTY' AND f."departmentId" = frm.department_id)
          OR (u.role = 'STUDENT' AND s."isCoordinator" = true AND s."departmentId" = frm.department_id)
        )
    )
  );

-- ─── RLS: form_fields, form_access, form_response_notes, form_audit_logs ──────

-- form_fields: readable to anyone who can read the parent form (handled app-side via Prisma)
CREATE POLICY "form_fields: authenticated read"
  ON public.form_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "form_fields: faculty manage"
  ON public.form_fields FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text
        AND u.role IN ('ADMIN','FACULTY')
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.students s ON s."userId" = u.id
      WHERE u."supabaseUid" = auth.uid()::text AND s."isCoordinator" = true
    )
  );

-- form_access: admin/faculty managed
CREATE POLICY "form_access: admin manage"
  ON public.form_access FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text AND u.role = 'ADMIN')
  );
CREATE POLICY "form_access: all read"
  ON public.form_access FOR SELECT TO authenticated USING (true);

-- form_response_notes: faculty manage, student can't see
CREATE POLICY "form_response_notes: faculty manage"
  ON public.form_response_notes FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text
        AND u.role IN ('ADMIN','FACULTY')
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.students s ON s."userId" = u.id
      WHERE u."supabaseUid" = auth.uid()::text AND s."isCoordinator" = true
    )
  );

-- form_audit_logs: admin/faculty read
CREATE POLICY "form_audit_logs: admin read"
  ON public.form_audit_logs FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u."supabaseUid" = auth.uid()::text AND u.role = 'ADMIN')
  );
CREATE POLICY "form_audit_logs: faculty insert"
  ON public.form_audit_logs FOR INSERT TO authenticated
  WITH CHECK (true); -- insertions validated at app level

-- ─── Grants ───────────────────────────────────────────────────────────────────

GRANT ALL ON public.forms               TO authenticated;
GRANT ALL ON public.form_fields         TO authenticated;
GRANT ALL ON public.form_responses      TO authenticated;
GRANT ALL ON public.form_answers        TO authenticated;
GRANT ALL ON public.form_access         TO authenticated;
GRANT ALL ON public.form_response_notes TO authenticated;
GRANT ALL ON public.form_audit_logs     TO authenticated;
