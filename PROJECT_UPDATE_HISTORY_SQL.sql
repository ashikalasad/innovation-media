-- Project Update History (run once in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS public.project_updates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
 updated_by uuid REFERENCES auth.users(id),
 designer_name text,
 progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
 status_label text,
 status_comment text,
 change_note text,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS project_updates_read_auth ON public.project_updates;
CREATE POLICY project_updates_read_auth ON public.project_updates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS project_updates_insert_auth ON public.project_updates;
CREATE POLICY project_updates_insert_auth ON public.project_updates FOR INSERT TO authenticated WITH CHECK (auth.uid() = updated_by);
NOTIFY pgrst, 'reload schema';
