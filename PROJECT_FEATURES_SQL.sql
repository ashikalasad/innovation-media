-- Run once in Supabase SQL Editor to support Project Edit, status, comments and employee assignments
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_designer_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS assigned_pasting_name text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status_label text NOT NULL DEFAULT 'Design Running';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status_comment text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0;
ALTER TABLE public.projects ADD CONSTRAINT projects_progress_range CHECK (progress BETWEEN 0 AND 100);
NOTIFY pgrst, 'reload schema';
