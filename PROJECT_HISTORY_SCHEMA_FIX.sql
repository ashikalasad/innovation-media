-- Run this in Supabase > SQL Editor > New query > Run
-- Safe migration: adds the assignment/status/progress columns required by this app.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_designer_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_pasting_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status_label text NOT NULL DEFAULT 'Design Running';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status_comment text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;

-- Ensure progress constraint exists without failing if it was already added.
DO $$ BEGIN
  ALTER TABLE public.projects ADD CONSTRAINT projects_progress_range CHECK (progress BETWEEN 0 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
